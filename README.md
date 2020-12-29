# homebridge-http-security-system
A Homebridge Plugin to control a Security System via HTTP commands


Based on initial code from my Garage Door Accessory:
https://github.com/PlasmaSoftUK/homebridge-http-garagedoor


I have a rPi Controlling my Texecom Premier Elite via a web server which also allows me to integrate to Alexa.
I would ideally like this integrated in to Homekit too, hence this plugin.

The aim is to have the plugin call the same web service that Alexa uses to control the Alarm:

http://127.0.0.1:4283/activate

http://127.0.0.1:4283/status

Then push that back in to HomeKit, and keep in sync if I use the Security Panel controls or Alexa.



# Install

sudo npm install -g https://github.com/PlasmaSoftUK/homebridge-http-securitysystem.git


Then in your config.json add this accessory:

```
{
    "accessory": "HTTPSecuritySystem",
    "name": "Alarm",
    "activateURL": "http://127.0.0.1:4283/activate",
    "statusURL": "http://127.0.0.1:4283/status",
    "statusPollInMs": 4000
}
```
