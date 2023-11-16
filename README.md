# A11yTester

Tool to test websites for A11y issues, HTML errors and broken links.

## Setup

## Ideas for improvements

- Add a vite build and add typescript to the mix for better programming. Also add tailwind for the layout of the HTML pages.
- Export errors to a HTMl file (Use this code as inspiration: https://github.com/pa11y/pa11y/blob/main/lib/reporters/html.js)
- Output to html from local generates a temp.html and hosts it in the browser (show progress in the cli when generating)
- Output to html from production makes a new file for project in a folder and adds it to the index for the overview. Generate the HTML from .json files with all the data
- Make a cronjob with the following options:
  - Maybe make this a next.js project and host in on Vercel?
  - Read Urls from a json file
  - Store the errors in a HTML file
    - Make this beautiful and interactive.
    - Give the option to ignore certain errors from further reporting.
  - Post to a slack channel if errors are encountered (https://dev.to/hrishikeshps/send-slack-notifications-via-nodejs-3ddn)
- Store the Urls from the sitemaps in the session file for quicker reruns.
