# homebridge-http-security-system
A Homebridge Plugin to control a Security System via HTTP commands


Based on initial code from my Garage Door Accessory:
https://github.com/PlasmaSoftUK/homebridge-http-garagedoor


I have a rPi Controlling my Texecom Premier Elite via a web server which also allows me to integrate to Alexa.
I would ideally like this integrated in to Homekit too, hence this plugin.

The aim is to have the plugin call the same web service that Alexa uses to control the Alarm:

http://127.0.0.1:25276/NIGHT_ARM

http://127.0.0.1:25276/STAY_ARM

http://127.0.0.1:25276/AWAY_ARM

http://127.0.0.1:25276/DISARMED

http://127.0.0.1:25276/STATUS

Then push that back in to HomeKit, and keep in sync if I use the Security Panel controls or Alexa.



# Install
                    
sudo npm install -g https://github.com/PlasmaSoftUK/homebridge-http-security-system.git

Following changes in Homebridge if you are installing this via the above method, you will then need to move the install from  its install directory because Homebridge no longer sees global modules. 

sudo mv /usr/local/lib/node_modules/homebridge-http-security-system/ /var/lib/homebridge/node_modules/
cd /var/lib/homebridge/node_modules/
sudo chown homebridge:homebridge homebridge-http-security-system

Then in your config.json add this accessory:

```
{
    "accessory": "HTTPSecuritySystem",
    "name": "Alarm",
    "controlURL": "http://127.0.0.1:25276",
    "statusPollInMs": 4000
}
```
