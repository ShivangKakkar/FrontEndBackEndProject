'use client'
import React, { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'date-fns'
import useSound from 'use-sound'
import axios from 'axios'

// const link = 'https://backend-todo-ruddy.vercel.app/'
const link = 'http://localhost:5000/'

const Page = () => {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [hour, setHour] = useState('12')
  const [minute, setMinute] = useState('00')
  const [period, setPeriod] = useState('AM')
  const [mainTask, setMainTask] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())

  const [theme, setTheme] = useState('light')
  const [play] = useSound('/assets/sound/alarm1.mp3')

  // Get all tasks using api
  const updateTasksUsingAPI = () => {
    axios
      .get(link + 'tasks')
      .then(function (response) {
        setMainTask(response.data)
      })
      .catch(function (error) {
        console.log(error)
      })
  }
  updateTasksUsingAPI()

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    // Remove the previous theme class
    document.body.classList.remove('light', 'dark')

    // Add the current theme class
    document.body.classList.add(theme)

    if (theme === 'dark') {
      // Apply dark mode styles
    } else {
      // Apply light mode styles
    }
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
      const currentTimeStr = format(currentTime, 'HH:mm')

      mainTask.forEach((task) => {
        if (currentTimeStr === task.time && !task.alarmPlayed) {
          playAlarm(task.title)
          // Mark the task as played to avoid continuous execution
          setMainTask((prevTasks) => {
            return prevTasks.map((prevTask) => {
              if (prevTask === task) {
                return { ...prevTask, alarmPlayed: true }
              }
              return prevTask
            })
          })

          const repeatIntervalId = setInterval(() => {
            playAlarm(task.title)
          }, 30000)

          // Clear the repeating interval after 5 minutes (adjust as needed)
          setTimeout(() => {
            clearInterval(repeatIntervalId)
          }, 300000)
        }
      })
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [currentTime, mainTask, play])

  const playAlarm = (taskTitle) => {
    play()

    // Show a notification for the specific task
    toast.success(`⏰ Time for task: ${taskTitle}!`, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark',
    })
  }

  const submitHandler = (e) => {
    e.preventDefault()

    if (!title || !desc || !hour || !minute) {
      toast.error('Please enter a title, description, and time.', {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      })
      return
    }

    if (!isValidTime()) {
      toast.error('Invalid time. Please enter a valid time.', {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      })
      return
    }

    // Call API
    let task = {
      title: title,
      description: desc,
      hours: parseInt(hour),
      minutes: parseInt(minute),
      am: period === 'AM' ? true : false,
    }
    axios
      .post(link + 'add', task, {
        params: task,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(function (response) {
        console.log(response)
      })
      .catch(function (error) {
        console.log(error)
      })
    setMainTask([...mainTask, { title, desc, time: getTimeIn24HourFormat() }])
    setTitle('')
    setDesc('')
    setHour('12')
    setMinute('00')
    setPeriod('AM')
    notify()
  }

  const deleteHandler = (i) => {
    let task = { id: mainTask[i].id }
    axios
      .post(link + 'remove', task, {
        params: task,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(function (response) {
        console.log(response)
      })
      .catch(function (error) {
        console.log(error)
      })
    // const updatedTasks = mainTask.filter((_, index) => index !== i)
    // setMainTask(updatedTasks)
  }

  const notify = () => {
    toast.success('🦄 Your Task is Added!', {
      position: 'top-right',
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark',
    })
  }

  const isValidTime = () => {
    const hourNum = parseInt(hour, 10)
    const minuteNum = parseInt(minute, 10)
    return (
      !isNaN(hourNum) &&
      hourNum >= 1 &&
      hourNum <= 12 &&
      !isNaN(minuteNum) &&
      minuteNum >= 0 &&
      minuteNum <= 59 &&
      (period === 'AM' || period === 'PM')
    )
  }

  const getTimeIn24HourFormat = () => {
    const hour24 = period === 'AM' ? hour % 12 : (hour % 12) + 12
    return `${hour24.toString().padStart(2, '0')}:${minute}`
  }

  const sortedTasks = mainTask.slice().sort((a, b) => {
    const timeA = new Date(`2000-01-01T${a.time}`).getTime()
    const timeB = new Date(`2000-01-01T${b.time}`).getTime()
    return timeA - timeB
  })

  let renderTask = <h2>No Task Available</h2>

  if (sortedTasks.length > 0) {
    renderTask = sortedTasks.map((task, i) => (
      <li key={i} className='flex items-center justify-between mb-8'>
        <div className='flex justify-between mb-5 w-2/3'>
          <h5 className='text-xl font-semibold'>{task.title}</h5>
          <h6 className='text-lg font-medium'>{task.desc}</h6>
          <p className='text-lg'>{task.time}</p>
        </div>
        <button
          onClick={() => {
            deleteHandler(i)
          }}
          className='bg-red-500 text-white px-4 py-2 rounded font-bold'
        >
          Delete
        </button>
      </li>
    ))
  }

  return (
    <>
      <div className='top-bar'>
        <h1 className='bg-black text-white p-5 text-2xl font-bold text-center'>
          Todo List
        </h1>
        <button
          className={`toggle-button ${theme === 'light' ? 'light' : 'dark'}`}
          onClick={toggleTheme}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      <div
        className='text-center text-2xl font-bold p-2 bg-sky-500 border-sky-500'
        suppressHydrationWarning
      >
        Current Time: {currentTime.toLocaleTimeString()}
      </div>

      <form
        onSubmit={submitHandler}
        className='flex flex-wrap items-center justify-center bg-lime-500'
      >
        <label htmlFor='title' className='sr-only'>
          Enter Title
        </label>
        <input
          type='text'
          id='title'
          className='text-2xl border border-gray-800 m-2 px-4 py-2'
          placeholder='Enter Title?'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label htmlFor='description' className='sr-only'>
          Description
        </label>
        <input
          type='text'
          id='description'
          className='text-2xl border border-gray-800 m-2 px-4 py-2'
          placeholder='Description?'
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <div className='flex justify-center '>
          <div className='scrollable-container'>
            <input
              type='number'
              className='text-2xl border border-gray-800 m-2 px-4 py-2'
              value={hour}
              min='1'
              max='12'
              onChange={(e) => setHour(e.target.value)}
            />
          </div>

          <span className='text-2xl'>:</span>

          <input
            type='number'
            className='text-2xl border border-gray-800 m-2 px-4 py-2'
            value={minute}
            min='0'
            max='59'
            onChange={(e) => setMinute(e.target.value)}
          />

          <select
            className='text-2xl border border-gray-800 m-2 px-4 py-2'
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value='AM'>AM</option>
            <option value='PM'>PM</option>
          </select>
        </div>
        <button
          type='submit'
          className='bg-black text-white m-2 px-4 py-3 text-2xl font-bold rounded'
        >
          Add Task
        </button>
      </form>
      <hr />

      <div className='bg-purple-500 p-4'>
        <ul>{renderTask}</ul>
      </div>
      <ToastContainer />
    </>
  )
}

export default Page
