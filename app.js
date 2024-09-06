const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const {format, isValid} = require('date-fns')

app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const connection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running')
    })
  } catch (error) {
    console.error('Database connection error:', error)
  }
}
connection()

const checkRequests = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params

  if (category !== undefined) {
    const categoryA = ['WORK', 'HOME', 'LEARNING']
    if (categoryA.includes(category)) {
      request.category = category
    } else {
      response.status(400).send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityA = ['HIGH', 'LOW', 'MEDIUM']
    if (priorityA.includes(priority)) {
      request.priority = priority
    } else {
      response.status(400).send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusA = ['TO DO', 'IN PROGRESS', 'DONE']
    if (statusA.includes(status)) {
      request.status = status
    } else {
      response.status(400).send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formattedDate = format(myDate, 'yyyy-MM-dd')
      if (isValid(myDate)) {
        request.date = formattedDate
      } else {
        response.status(400).send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400).send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q
  next()
}

const checkRequestsBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    const categoryA = ['WORK', 'HOME', 'LEARNING']
    if (categoryA.includes(category)) {
      request.category = category
    } else {
      response.status(400).send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityA = ['HIGH', 'LOW', 'MEDIUM']
    if (priorityA.includes(priority)) {
      request.priority = priority
    } else {
      response.status(400).send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusA = ['TO DO', 'IN PROGRESS', 'DONE']
    if (statusA.includes(status)) {
      request.status = status
    } else {
      response.status(400).send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formattedDate = format(myDate, 'yyyy-MM-dd')
      if (isValid(myDate)) {
        request.dueDate = formattedDate
      } else {
        response.status(400).send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400).send('Invalid Due Date')
      return
    }
  }

  request.todo = todo
  request.id = id
  request.todoId = todoId
  next()
}

// API 1
app.get('/todos/', checkRequests, async (request, response) => {
  const {status = '', search_q = '', priority = '', category = ''} = request
  const getTodoQuery = `SELECT id, todo, priority, status, category, due_date AS dueDate
                        FROM todo
                        WHERE todo LIKE '%${search_q}%'
                        AND priority LIKE '%${priority}%'
                        AND status LIKE '%${status}%'
                        AND category LIKE '%${category}%'`

  const todoArray = await db.all(getTodoQuery)
  response.send(todoArray)
})

// API 2
app.get('/todos/:todoId/', checkRequests, async (request, response) => {
  const {todoId} = request
  const getQuery = `SELECT id, todo, priority, status, category, due_date AS dueDate
                    FROM todo
                    WHERE id = '${todoId}'`
  const todo = await db.get(getQuery)
  response.send(todo)
})

// API 3
app.get('/agenda/', checkRequests, async (request, response) => {
  const {date} = request
  const query = `SELECT id, todo, priority, status, category, due_date AS dueDate
                 FROM todo
                 WHERE due_date = '${date}'`

  const todoArray = await db.all(query)
  if (todoArray.length === 0) {
    response.status(400).send('Invalid Due Date')
  } else {
    response.send(todoArray)
  }
})

// API 4
app.post('/todos/', checkRequestsBody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request
  const addQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date)
                    VALUES ('${id}', '${todo}', '${priority}', '${status}', '${category}', '${dueDate}')`

  await db.run(addQuery)
  response.send('Todo Successfully Added')
})

// API 5
app.put('/todos/:todoId/', checkRequestsBody, async (request, response) => {
  const {todoId} = request
  const {priority, todo, status, category, dueDate} = request

  let updateQuery = ''
  if (status !== undefined) {
    updateQuery = `UPDATE todo SET status = '${status}' WHERE id = '${todoId}'`
    response.send('Status Updated')
  } else if (priority !== undefined) {
    updateQuery = `UPDATE todo SET priority = '${priority}' WHERE id = '${todoId}'`
    response.send('Priority Updated')
  } else if (todo !== undefined) {
    updateQuery = `UPDATE todo SET todo = '${todo}' WHERE id = '${todoId}'`
    response.send('Todo Updated')
  } else if (category !== undefined) {
    updateQuery = `UPDATE todo SET category = '${category}' WHERE id = '${todoId}'`
    response.send('Category Updated')
  } else if (dueDate !== undefined) {
    updateQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = '${todoId}'`
    response.send('Due Date Updated')
  }

  if (updateQuery) {
    await db.run(updateQuery)
  }
})

// API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `DELETE FROM todo WHERE id = '${todoId}'`

  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
