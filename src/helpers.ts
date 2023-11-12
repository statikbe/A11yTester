import * as cheerio from "cheerio";

export class Helper {
  constructor() {}
  public static getUrlsFromSitemap = (
    sitemapUrl: string,
    sitemapExclude: string,
    urls: Array<string>
  ): Promise<string[] | undefined> => {
    return Promise.resolve()
      .then(() =>
        fetch(sitemapUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; StatikTesterBot/0.1; +http://www.statik.be/)",
          },
        })
      )
      .then((response) => response.text())
      .then((body) => {
        const $ = cheerio.load(body, { xmlMode: true });

        const isSitemapIndex = $("sitemapindex").length > 0;
        if (isSitemapIndex) {
          return Promise.all(
            $("sitemap > loc")
              .toArray()
              .map((element: cheerio.Element) => {
                return this.getUrlsFromSitemap(
                  $(element).text(),
                  sitemapExclude,
                  urls
                );
              })
          ).then((configs) => {
            return configs.pop();
          });
        }

        $("url > loc")
          .toArray()
          .forEach((element) => {
            let url = $(element).text();
            if (sitemapExclude.length > 0 && url.match(sitemapExclude)) {
              return;
            }
            urls.push(url);
          });
        return urls;
      })
      .catch((error) => {
        if (error.stack && error.stack.includes("node-fetch")) {
          throw new Error(`The sitemap "${sitemapUrl}" could not be loaded`);
        }
        console.log(error);
        throw new Error(`The sitemap "${sitemapUrl}" could not be parsed`);
      });
  };
}
