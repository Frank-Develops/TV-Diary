require('dotenv').config();
const express = require('express');
const port = process.env.PORT;
const staticMiddleware = require('./static-middleware');
const app = express();
const argon2 = require('argon2');
const ClientError = require('./client-error');
const authorizationMiddleware = require('./authorization-middleware');
const jwt = require('jsonwebtoken');

const { Client } = require('pg');

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect();

app.use(staticMiddleware);
app.use(express.json());

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`express server listening on port ${port}`);
});

app.post('/api/users/sign-up', (req, res, next) => {

  const { username, password } = req.body;
  if (!username || !password) {
    throw new ClientError(400, 'username and password are required fields');
  }

  argon2
    .hash(password)
    .then(hashedPassword => {
      const values = [username, hashedPassword];
      const sql = `insert into "users"("username", "hashedPassword")
        values ($1, $2)
        returning *
        `;
      db.query(sql, values)
        .then(result => {
          const userAccount = result.rows[0];
          delete userAccount.hashedPassword;
          const payload = {
            userId: userAccount.userId,
            username: userAccount.username
          };
          const token = jwt.sign(payload, process.env.TOKEN_SECRET);
          const response = {
            token: token,
            user: payload
          };
          res.json(response);
          res.status(201).json(userAccount);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
});

app.post('/api/users/sign-in', (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new ClientError(401, 'invalid login');
  }
  const sql = `
    select "userId",
           "hashedPassword"
      from "users"
     where "username" = $1;
  `;
  const params = [username];
  db.query(sql, params)
    .then(result => {
      const userInfo = result.rows[0];
      if (!userInfo) {
        throw new ClientError(401, 'invalid login');
      } else {
        argon2
          .verify(userInfo.hashedPassword, password)
          .then(isMatching => {
            if (!isMatching) {
              throw new ClientError(401, 'invalid login');
            } else {
              const payload = {
                userId: userInfo.userId,
                username: username
              };
              const token = jwt.sign(payload, process.env.TOKEN_SECRET);
              const response = {
                token: token,
                user: payload
              };
              res.json(response);
            }
          })
          .catch(err => next(err));
      }
    })
    .catch(err => next(err));
});

app.use(authorizationMiddleware);

app.get('/api/watchlist/:user', (req, res) => {
  const userId = parseInt(req.params.user, 10);
  const sql = `
    select *
      from "watchlist"
      where "userId" = $1
      order by "entryId"
  `;
  const params = [userId];
  db.query(sql, params)
    .then(result => {
      res.json(result.rows);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'an unexpected error occurred'
      });
    });
});

app.get('/api/log/:user', (req, res) => {
  const userId = parseInt(req.params.user, 10);
  const sql = `
    select *
      from "log"
      where "userId" = $1
      order by "logId"
  `;
  const params = [userId];
  db.query(sql, params)
    .then(result => {
      res.json(result.rows);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'an unexpected error occurred'
      });
    });
});

app.post('/api/watchlist', (req, res, next) => {
  const userId = req.user.userId;
  const { show, episodeName, season, number, image, isWatched = false } = req.body;
  const sql = `
    insert into "watchlist" ("userId", "show", "episode name", "season", "number", "image", "isWatched")
    values ($1, $2, $3, $4, $5, $6, $7)
    returning *
  `;
  const params = [userId, show, episodeName, season, number, image, isWatched];
  db.query(sql, params)
    .then(result => {
      const [episode] = result.rows;
      res.status(201).json(episode);
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/api/watchlist/:deleteId', (req, res) => {
  const deleteId = parseInt(req.params.deleteId, 10);
  if (!Number.isInteger(deleteId) || deleteId <= 0) {
    res.status(400).json({
      error: '"deleteId" must be a positive integer'
    });
    return;
  }
  const sql = `
    delete from "watchlist"
    where "entryId" =  $1
    returning *;
  `;
  const params = [deleteId];
  db.query(sql, params)
    .then(result => {
      const deleteId = result.rows[0];
      if (!deleteId) {
        res.status(404).json({
          error: `Cannot find item with "deleteId" ${deleteId}`
        });
      } else {
        res.status(204).json(deleteId);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'An unexpected error occurred.'
      });
    });
});

app.delete('/api/log/:deleteId', (req, res) => {
  const deleteId = parseInt(req.params.deleteId, 10);
  if (!Number.isInteger(deleteId) || deleteId <= 0) {
    res.status(400).json({
      error: '"deleteId" must be a positive integer'
    });
    return;
  }
  const sql = `
    delete from "log"
    where "logId" =  $1
    returning *;
  `;
  const params = [deleteId];
  db.query(sql, params)
    .then(result => {
      const deleteId = result.rows[0];
      if (!deleteId) {
        res.status(404).json({
          error: `Cannot find item with "deleteId" ${deleteId}`
        });
      } else {
        res.status(204).json(deleteId);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'An unexpected error occurred.'
      });
    });
});

app.put('/api/log/:updateId', (req, res) => {
  const updateId = parseInt(req.body.episodeToUpdate, 10);
  const rating = req.body.rating;
  if (!Number.isInteger(updateId) || updateId <= 0) {
    res.status(400).json({
      error: '"updateId" must be a positive integer'
    });
    return;
  }
  const sql = `
    update log
    set rating = $1
    where "logId" =  $2
    returning *;
  `;
  const params = [rating, updateId];
  db.query(sql, params)
    .then(result => {
      const updateId = result.rows[0];
      if (!updateId) {
        res.status(404).json({
          error: `Cannot find item with "updateId" ${updateId}`
        });
      } else {
        res.status(204).json(updateId);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: 'An unexpected error occurred.'
      });
    });
});

app.post('/api/log', (req, res, next) => {
  const userId = req.user.userId;
  const { date, showName, episodeName, season, number, image, rating } = req.body;
  const sql = `
    insert into "log" ("userId", "date", "show", "episode name", "season", "number", "image", "rating")
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning *
  `;
  const params = [userId, date, showName, episodeName, season, number, image, rating];
  db.query(sql, params)
    .then(result => {
      const [entry] = result.rows;
      res.status(201).json(entry);
    })
    .catch(err => {
      console.error(err);
    });
});
