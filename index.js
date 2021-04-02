const puppeteer = require("puppeteer")

const config = require('./config.json')

let browser

let lastPost

async function main() {

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

     await page.type("#email", config.username, {
          delay: 30
     })
     await page.type("#pass", config.password, {
          delay: 30
     })

     await page.waitForSelector('[data-cookiebanner="accept_button"]')
          .then(page.click('[data-cookiebanner="accept_button"]'))

     const loginButton = await page.waitForXPath(
          '//*[@id="loginbutton"]'
     );

     await page.waitForTimeout(1000)

     await loginButton.click().catch((e) => console.log(e))


     await page.waitForTimeout(10000)

     const url = `https://www.facebook.com/groups/${config.groupID}`

     await page.goto(url)

     await page.waitForTimeout(1000)

     // Prendre le dernier post
     lastPost = await page.$eval('[role="feed"] > div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(3) > div > div > div > div', el => el.textContent)
     console.log(lastPost)
     
     // Boucle :
     setInterval(async () => {
          await page.reload()
          await page.waitForTimeout(1000)
          // toutes les x secondes , récupérer le dernier post et le comparer a l'ancien
          let newLastPost = await page.$eval('[role="feed"] > div:nth-child(2) > div > div > div > div > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(3) > div > div > div > div', el => el.textContent)
          if (newLastPost != lastPost) {
               lastPost = newLastPost
               console.log(lastPost)
               // Si il esst différent et qu'il commence par shotgun : commenter
               if (lastPost.toUpperCase().startsWith("// SHOTGUN //") || lastPost.toUpperCase().startsWith("SHOTGUN") || lastPost.toUpperCase().startsWith("SHOTGUN", 3) || lastPost.toUpperCase().startsWith("SHOTGUN", 4)) {
                    await page.type('[contenteditable="true"]', config.comment, {
                         delay: 5
                    })
                    await page.type('[contenteditable="true"]', String.fromCharCode(13));
               }
          }
     }, 4000);


}

main()