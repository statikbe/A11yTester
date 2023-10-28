const cheerio = require("cheerio");

const getUrlsFromSitemap = (sitemapUrl, sitemapExclude, urls) => {
  return Promise.resolve()
    .then(() => fetch(sitemapUrl))
    .then((response) => response.text())
    .then((body) => {
      const $ = cheerio.load(body, { xmlMode: true });

      const isSitemapIndex = $("sitemapindex").length > 0;
      if (isSitemapIndex) {
        return Promise.all(
          $("sitemap > loc")
            .toArray()
            .map((element) => {
              return getUrlsFromSitemap(
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
          if (sitemapExclude != undefined && url.match(sitemapExclude)) {
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

exports.getUrlsFromSitemap = getUrlsFromSitemap;
