# homebridge-http-security-system
A Homebridge Plugin to control a Security System via HTTP commands


Based on initial code from my Garage Door Accessory:
https://github.com/PlasmaSoftUK/homebridge-http-garagedoor


I have a rPi Controlling my Texecom Premier Elite via a web server which also allows me to integrate to Alexa.
I would ideally like this integrated in to Homekit too, hence this plugin.

The aim is to have the plugin call the same web service that Alexa uses to control the Alarm:

http://127.0.0.1:52576/NIGHT_ARM

http://127.0.0.1:52576/STAY_ARM

http://127.0.0.1:52576/AWAY_ARM


http://127.0.0.1:52576/STATUS

Then push that back in to HomeKit, and keep in sync if I use the Security Panel controls or Alexa.



# Install
                    
sudo npm install -g https://github.com/PlasmaSoftUK/homebridge-http-security-system.git


Then in your config.json add this accessory:

```
{
    "accessory": "HTTPSecuritySystem",
    "name": "Alarm",
    "controlURL": "http://127.0.0.1:52576",
    "statusPollInMs": 4000
}
```
