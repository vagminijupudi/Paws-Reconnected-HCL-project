const express = require('express');
const session = require('express-session')
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ejs = require('ejs');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));



const storage = multer.diskStorage({
    destination: 'public/uploads',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg');
    },
});

const upload = multer({ storage });


const csvFilePath = 'petData.csv';
if (!fs.existsSync(csvFilePath)) {
    const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'Name', title: 'Name' },
            { id: 'Type', title: 'Type' },
            { id: 'Description', title: 'Description' },
            { id: 'Image', title: 'Image' },
            { id: 'Status', title: 'Status' },
        ],
    });

    csvWriter.writeRecords([]); 
    console.log('CSV file created.');
}

const userCSVFilePath = 'users.csv';
if (!fs.existsSync(userCSVFilePath)) {
    fs.writeFileSync(userCSVFilePath, 'Username,Email,Password\n', 'utf8');
}
const userData = [];

// Load user data from the CSV file
fs.createReadStream('users.csv')
    .pipe(csv())
    .on('data', (row) => {
        userData.push(row);
    })
    .on('end', () => {
        console.log('User data loaded.');
    });

// Set up express-session for session management
app.use(session({
    secret: 'welcome', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
}));

// Middleware to check if the user is authenticated
function requireAuth(req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login', { message: '' });
 });
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = userData.find((user) => user.Username == username && user.Password == password);
    
    if (true) {
        // Set the session variable to remember the logged-in user
        req.session.username = username;
        res.redirect('/form'); // Redirect to a dashboard page
    } else {
        res.redirect('/form');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup', { message: '' });
});

app.post('/signup', (req, res) => {
    const { username,email,password } = req.body;
    
    if (userData.some((user) => user.Username === username)) {
        res.render('signup', { message: 'Username already exists. Please choose a different username.' });
    } else {
        // Add the new user to the CSV file
        userData.push({ Username: username, Email:email,Password: password });
        fs.appendFile('users.csv', `\n${username},${email},${password}`, (err) => {
            if (err) {
                res.status(500).send('Error creating user');
            } else {
                // Set the session variable to remember the logged-in user
                req.session.username = username;
                res.redirect('/form'); // Redirect to a dashboard page
            }
        });
    }
});

app.get('/form', requireAuth, (req, res) => {
    // Access the logged-in user's username using req.session.username
    const currentUser = req.session.username;
    res.render('form', { currentUser });
});

app.get('/form', (req, res) => {
    res.render('form');
});

// Handle form submission
app.post('/submit', upload.single('image'), async(req, res) => {
    const { name, type, description,imageUrl,lostOrFound} = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
    console.log(imagePath)
  
    const csvRow = {
        Name: name,
        Type: type,
        Description: description,
        Image: imagePath,
        Status: lostOrFound,
    };

    // Append the CSV row to the CSV file
    const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'Name', title: 'Name' },
            { id: 'Type', title: 'Type' },
            { id: 'Description', title: 'Description' },
            { id: 'Image', title: 'Image' },
            { id: 'Status', title: 'Status' },
        ],
        append: true,
    });

    csvWriter.writeRecords([csvRow]).then(() => {
        console.log('Data saved to CSV');
        res.redirect('/blog');
    });
    try {
        const postToInsta = require('./server');
        postToInsta();
    } catch (error) {
        console.error('Error posting to Instagram:', error);
        res.status(500).send('Error posting to Instagram.');
    }
});


app.set('view engine', 'ejs');
app.get('/blog', (req, res) => {
    const petData = [];

    // Read data from the CSV file and push it to the petData array
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            petData.push(data);
        })
        .on('end', () => {
            // Render the blog page with pet details
            res.render('blog', { petData });
        });
});
app.use((req, res, next) => {
    res.locals.currentUser = req.session.username;
    next();
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
