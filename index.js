const puppeteer = require("puppeteer")

const config = require('./config.json')
const accounts = require('./accounts.json')

async function main(account) {

     let browser
     let posted = false
     let feed, lastPost, newFeed, newLastPost

     browser = await puppeteer.launch({
          headless: config.headless
     })

     const context = browser.defaultBrowserContext();

     context.overridePermissions("https://www.facebook.com", []);

     const page = await browser.newPage()

     await page.setDefaultNavigationTimeout(100000);
     await page.setViewport({
          width: 1200,
          height: 800
     });

     await page.goto("https://www.facebook.com/login", {
          waitUntil: "networkidle2"
     });

     await page.type("#email", account.login, {
          delay: 30
     })
     await page.type("#pass", account.password, {
          delay: 30
     })

     await page.waitForSelector('[data-cookiebanner="accept_button"]')
          .then(page.click('[data-cookiebanner="accept_button"]'))

     const loginButton = await page.waitForXPath(
          '//*[@id="loginbutton"]'
     );

     await page.waitForTimeout(1000)

     await loginButton.click().catch((e) => console.log(e))


     await page.waitForTimeout(8000)

     const url = `https://www.facebook.com/groups/${config.groupID}?sorting_setting=CHRONOLOGICAL`

     await page.goto(url)

     await page.waitForTimeout(3000)

     // Prendre le dernier post
     await page.waitForSelector('[role="feed"] > div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(3) > div > div > div')
     feed = await page.$('[role="feed"] > div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(3) > div > div > div').catch((err) => console.log("feed missing for account ", account.login))
     lastPost = await page.evaluate(el => el.textContent, feed)
     console.log(`last post for account ${account.login} : ${lastPost}`)

     while (!posted) {
          await page.reload()
          await page.waitForSelector('[role="feed"] > div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(3) > div > div > div')
          newFeed = await page.$('[role="feed"] > div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(3) > div > div > div').catch((err) => console.log("feed missing for account ", account.login))
          newLastPost = await page.evaluate(el => el.textContent, newFeed)
          console.log(`old post : ${lastPost} for ${account.login}`)
          console.log(`new post : ${newLastPost} ${account.login}`)
          if (typeof newLastPost !== 'undefined' && newLastPost != lastPost) {
               lastPost = newLastPost
               console.log(`NEW POST : ${newLastPost}`)
               // Si il est différent et qu'il commence par shotgun : commenter
               if (lastPost.toUpperCase().includes(config.keyword.toUpperCase())) {
                    await page.type('[contenteditable="true"]', config.comment, {
                         delay: 5
                    })
                    await page.type('[contenteditable="true"]', String.fromCharCode(13));
                    await page.waitForTimeout(3000).then(posted = true)
               }
          }
     }
     
     await page.waitForTimeout(1000)
     await browser.close()
     return
}

accounts.list.forEach((account) => {
     main(account)
});