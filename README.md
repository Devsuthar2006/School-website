# School-Websites-Template

## Deploying

### Environment variables

Set the following environment variables on your hosting platform:

- `PORT` – default `3000`
- `SESSION_SECRET` – any strong random string

### Run locally

```
npm install
npm run dev
# Open http://localhost:3001/admin (or PORT if changed)
```

### Deploy to Render

1. Push this repo to GitHub
2. Create a new Web Service on Render
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add env vars `SESSION_SECRET`, optional `PORT`

### Deploy to Railway

1. New Project → Deploy from GitHub
2. Add env vars `SESSION_SECRET`, optional `PORT`
3. Railway will run `npm start`

### Deploy to Heroku

1. Install Heroku CLI and login
2. Ensure `Procfile` exists (web: node server.js)
3. `heroku create`
4. `heroku config:set SESSION_SECRET=...`
5. `git push heroku main`

this websites was made during an competition on the school 
This template got 2nd on school so i hope you give us credit while using it 

This code is deployed on
```https://wumpuspro.github.io/School-Websites-Template/```
