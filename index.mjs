import { Extension, Image, Parameter, Link } from 'talkops'
import { URLSearchParams } from 'url'
import axios from 'axios'

const apiKey = new Parameter('API_KEY').setDescription('The copied API key.').setType('password')
const domains = new Parameter('DOMAINS')
  .setDescription('A comma-seperated string of domains to restrict the search to.')
  .setPossibleValues(['bbc.co.uk', 'blog.jetbrains.com,javascriptweekly.com,stackoverflow.com'])
const excludeDomains = new Parameter('EXCLUDE_DOMAINS')
  .setDescription('A comma-seperated string of domains to remove from the results.')
  .setPossibleValues(['www.xataka.com', 'www.businessinsider.com,www.theverge.com'])

import search_news from './schemas/functions/search_news.json' with { type: 'json' }

const extension = new Extension()
  .setName('News API')
  .setWebsite('https://newsapi.org/')
  .setIcon('https://newsapi.org/apple-touch-icon.png')
  .setCategory('news')
  .setFeatures(['Search for the latest news.'])
  .setinstallationSteps([
    '[Register](https://newsapi.org/register) on the website.',
    'Copy the API key to setup the parameter or the environment variable \`API_KEY\`.',
  ])
  .setParameters([apiKey])
  .setInstructions(
    'You are a news anchor reporting live on a major breaking news story. Deliver the news with professionalism and clarity.',
  )
  .setFunctionSchemas([search_news])
  .setFunctions([
    async function search_news(keywords) {
      try {
        const searchParams = new URLSearchParams({
          apiKey: apiKey.getValue(),
          ...(domains.getValue() && { domains: domains.getValue() }),
          ...(excludeDomains.getValue() && { excludeDomains: excludeDomains.getValue() }),
          q: keywords,
        })
        const response = await axios.get(
          `https://newsapi.org/v2/everything?${searchParams.toString()}`,
        )
        const articles = response.data.articles.filter((article) => article.description).slice(0, 1)
        if (articles.length > 0) {
          articles.forEach((article) => {
            const medias = [new Link(article.url)]
            if (article.urlToImage) {
              medias.push(new Image(article.urlToImage))
            }
            extension.sendMedias(medias)
          })
          return articles
            .map((article) => {
              return `Latest news (${article.publishedAt}): ${article.description}. Invite the user to open the article by clicking on the attached link.`
            })
            .join('|')
        } else {
          return `No news found`
        }
      } catch (err) {
        return `Error: ${err.message}`
      }
    },
  ])
