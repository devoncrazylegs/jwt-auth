//Get the packages
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var mongoose   = require('mongoose');

var jwt        = require('jsonwebtoken');
var config     = require('./config');
var User       = require('./app/models/user');


//Configuration
var port = process.env.PORT || 8090;
mongoose.connect(config.database);
app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));


//Routes
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

//API routes
var apiRoutes = express.Router();

//authenticate a user
apiRoutes.post('/authenticate', function(req, res) {
    User.findOne({
        name: req.body.name
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    //expiresInMinutes: 1440 // expires in 24 hours
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});

apiRoutes.use(function(req, res, next) {
    //check header or URL parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if(token) {
        //verfiys secret amd checks expiry
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if(err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token'
                });
            } else {
                //if everything is good save to request for use in other routes
                req.decoded = decoded;
                next();
            }

        });
    } else {
        //no token send an error
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        });
    }
});

apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the API base endpoint' });
});

apiRoutes.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
});

app.use('/api', apiRoutes)


app.get('/setup', function(req, res) {

    //Create a sample user
    var nick = new User({
        name: 'Nick Cerminara',
        password: 'password',
        admin: true
    });

    //save the user
    nick.save(function(err) {
        if(err) throw err;

        console.log("user saved");
        res.json({ success: true });
    });

});



app.listen(port);
console.log('Magic happens at http://localhost:' + port);
