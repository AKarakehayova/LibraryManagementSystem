const express = require('express')
const app = express()
var users = require('./users.js')
var auth = require('./auth.js')
const cors = require('cors')
var books = require('./books.js')
var rating = require('./rating.js')
const bodyParser = require('body-parser')
var jwt = require('jsonwebtoken')

app.set('port', process.env.PORT || 3001)
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'))
}
function errorHandler (err, req, res, next) {
  var code = err.code
  var message = err.message
  res.writeHead(code, message, {'content-type': 'text/plain'})
  res.end(message)
}

app.use(errorHandler)
// ================authentication =================
app.post('/api/login', (req, res, next) => {
  auth.login(req.body).then((resp) => {
    res.send(resp)
  })
    .catch((error) => {
      var err = new Error('Password or username are invalid')
      err.code = 400
      return next(err)
    })
})

var adminRoute = function (req, res, next) {
  var token = req.headers['authorization']
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    })
    // return next(); //if no token, continue
  } else {
    token = token.replace('Bearer ', '')
    jwt.verify(token, 'asd', function (err, user) {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        })
      } else {
        if (user.admin === 0) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized'
          })
        } else {
          req.user = user // set the user to req so other routes can use it
          next()
        }
      }
    })
  }
}

var userRoute = function (req, res, next) {
  var token = req.headers['authorization']
  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    })
    // return next(); //if no token, continue
  } else {
    token = token.replace('Bearer ', '')
    jwt.verify(token, 'asd', function (err, user) {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        })
      } else {
        req.user = user // set the user to req so other routes can use it
        next()
      }
    })
  }
}

// ================authentication =================

// users
app.get('/api/users', userRoute, (req, res) => {
  users.getUsers().then((resp) => {
    res.send(resp)
  })
})

app.get('/api/user/:id', (req, res) => {
  users.getUser(req.params.id).then((resp) => {
    res.send(resp)
  })
})

app.post('/api/user', (req, res) => {
  users.addUser(req.body).then((resp) => {
    res.send(resp)
  })
    .catch((error) => {
      res.send(error)
    })
})

app.delete('/api/borrow/book/:bookId/user/:userId', adminRoute, (req, res) => {
  books.returnBook(req.params.userId, req.params.bookId).then((resp) => {
    res.send(resp)
  })
})

app.put('/api/user/:id', userRoute, (req, res) => {
  console.log(req.body)
  var data = {
    id: req.params.id,
    data: req.body
  }
  users.updateUser(data).then((resp) => {
    res.send(resp)
  })
})

app.delete('/api/user/:id', adminRoute, (req, res) => {
  var id = req.params.id

  users.deleteUser(id).then((resp) => {
    res.send(resp)
  })
})

// books
app.get('/api/books', (req, res) => {
  books.getBooks(req.query).then((resp) => {
    res.send(resp)
  })
})

app.get('/api/book/:id', (req, res) => {
  books.getBook(req.params.id).then((resp) => {
    res.send(resp)
  })
    .catch((error) => {
      console.log('error', error)
    })
})

app.post('/api/book', adminRoute, (req, res) => {
  console.log(req.body)
  books.addBook(req.body).then((resp) => {
    res.send(resp)
  })
    .catch((error) => {
      console.log(error)
    })
})

app.put('/api/book/:id', adminRoute, (req, res) => {
  var data = {
    id: req.params.id,
    data: req.body
  }
  books.editBook(data).then((resp) => {
    res.send(resp)
  })
})

app.delete('/api/book/:id', adminRoute, (req, res) => {
  books.deleteBook(req.params.id).then((resp) => {
    res.send(resp)
  })
})

app.put('/api/borrow/book/:bookId/user/:userId', adminRoute, (req, res) => {
  books.borrowBook(req.params.bookId, req.params.userId).then((resp) => {
    res.send(resp)
  })
})

// ratings
app.post('/api/:book_id/:user_id', (req, res) => {
  rating.like(req.params.book_id, req.params.user_id).then((resp) => {
    res.send(resp)
  })
})

app.delete('/api/:book_id/:user_id', (req, res) => {
  rating.dislike(req.params.book_id, req.params.user_id).then((resp) => {
    res.send(resp)
  })
})
app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`) // eslint-disable-line no-console
})
