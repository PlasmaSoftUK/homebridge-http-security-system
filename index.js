/* jshint node: true */
"use strict";
var Service;
var Characteristic;
var AlarmState;

const http = require('http');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    AlarmState = homebridge.hap.Characteristic.SecuritySystemCurrentState;
    
    homebridge.registerAccessory("homebridge-http-securitysystem", "HTTPSecuritySystem", HttpSecuritySystemAccessory);
};

function HttpSecuritySystemAccessory(log, config) {
    
    this.log = log;
    this.version = require('./package.json').version;
    log("HTTPSecuritySystem version " + this.version);
    
    this.name = config.name;
    
    this.activateURL = config['activateURL'];
    this.statusURL = config['statusURL'];
    this.statusPollInMs = config['statusPollInMs'];
    
    log("          name: " + this.name);
    log("   activateURL: " + this.activateURL);
    log("     statusURL: " + this.statusURL);
    log("statusPollInMs: " + this.statusPollInMs);
    
    this.initService();
}


HttpSecuritySystemAccessory.prototype = {
        
    monitorAlarmState: function() {
  
        let req = http.get(this.statusURL, res => {
            let recv_data = '';
            res.on('data', chunk => { recv_data += chunk});
            res.on('end', () => {
                // recv_data contains state info.... {"alarmStatus":"Disarmed"}
                let state = JSON.parse(recv_data).alarmStatus;
                let newState = AlarmState.DISARMED;
                if (state == "Disarmed") {
                  newState = AlarmState.DISARMED;
                } else if (state == "Stay Armed") {
                  newState = AlarmState.STAY_ARM;
                } else if (state == "Away Armed") {
                  newState = AlarmState.AWAY_ARM;
                } else if (state == "Night Armed") {
                  newState = AlarmState.NIGHT_ARM;
                } else if (state == "Triggered") {
                  newState = AlarmState.ALARM_TRIGGERED;
                }
                
                this.log(this.name + '  Pre Monitor: Status Update: ' + state + ' (' + newState + ')');
                this.log(this.name + '  Pre Monitor:  CurrentState: ' + this.alarmStateToString(this.currentState));
                this.log(this.name + '  Pre Monitor:   TargetState: ' + this.alarmStateToString(this.targetState));
                
                
                if (this.currentState != newState){
                    this.log(this.name + ' New Status Update: ' + state);
                    this.currentState = newState;
                    this.currentAlarmState.updateValue(this.currentState);
                    
               
                    //Check if Alarm is changing state from external activation if so update target state
                    if(this.initialising && newState != AlarmState.DISARMED){
                        //We have initialised and the Alarm is already armed update target state
                        this.log(this.name + ' Initial Status is now Armed');
                        this.targetState = newState;
                        this.targetAlarmState.updateValue(this.targetState);                   
                    } else if(this.targetState == AlarmState.DISARMED && newState != AlarmState.DISARMED) {
                        this.log(this.name + ' was Disarmed but now Armed');
                        this.targetState = newState;
                        this.targetAlarmState.updateValue(this.targetState); 
                    } else if(this.targetState != AlarmState.DISARMED && newState == AlarmState.DISARMED) {
                        this.log(this.name + ' was Armed but now Disarmed');
                        this.targetState = AlarmState.DISARMED;
                        this.targetAlarmState.updateValue(this.targetState); 
                    }
                }
                

                this.log(this.name + ' Post Monitor:  CurrentState: ' + this.alarmStateToString(this.currentState));
                this.log(this.name + ' Post Monitor:   TargetState: ' + this.alarmStateToString(this.targetState));

                
                //Clear initialising flag first time this runs
                this.initialising = false;
                
                setTimeout(this.monitorAlarmState.bind(this), this.statusPollInMs);
                return state;
            });
        });
        req.on('error', err => {
            this.currentState = AlarmState.DISARMED;
            this.log("Error in monitorAlarmState: "+ err.message);

            setTimeout(this.monitorAlarmState.bind(this), this.statusPollInMs);
            return err.message;
        })
    },



    alarmStateToString: function(state) {
    
    /*
    
		STAY_ARM = 0;
		AWAY_ARM = 1;
		NIGHT_ARM = 2;
		DISARMED = 3;
		ALARM_TRIGGERED = 4;
    
    
		this.log(this.name + "stateToString:  TEST STAY_ARM (" + AlarmState.STAY_ARM + ")");
		this.log(this.name + "stateToString:  TEST AWAY_ARM (" + AlarmState.AWAY_ARM + ")");
		this.log(this.name + "stateToString: TEST NIGHT_ARM (" + AlarmState.NIGHT_ARM + ")");
		this.log(this.name + "stateToString:    TEST DISARM (" + AlarmState.DISARMED + ")");
		this.log(this.name + "stateToString: TEST TRIGGERED (" + AlarmState.ALARM_TRIGGERED + ")");
    */
    
        switch (state) {
          case AlarmState.DISARMED:
            return "DISARMED";
          case AlarmState.AWAY_ARM:
            return "AWAY_ARM";     
          case AlarmState.STAY_ARM:
            return "STAY_ARM";
          case AlarmState.NIGHT_ARM:
            return "NIGHT_ARM";
          case AlarmState.ALARM_TRIGGERED:
            return "TRIGGERED";
          default:
          	this.log(this.name + "stateToString: UNKNOWN STATE (" + state + ")");
            return "UNKNOWN";
        }
    },
    
    initService: function() {
        this.securitySystem = new Service.SecuritySystem(this.name,this.name);
        
        this.currentAlarmState = this.securitySystem.getCharacteristic(Characteristic.SecuritySystemCurrentState);
        this.currentAlarmState.on('get', this.getState.bind(this));
        
        this.targetAlarmState = this.securitySystem.getCharacteristic(Characteristic.SecuritySystemTargetState);
        this.targetAlarmState.on('set', this.setTargetState.bind(this));
        this.targetAlarmState.on('get', this.getTargetState.bind(this));
        
        
        /*
        
        Use updateCharacteristic if you want to change the state of a characteristic without triggering the set handler.

		eg.

		this.service.updateCharacteristic(Characteristic.SecuritySystemCurrentState, Characteristic.SecuritySystemCurrentState.DISARMED);
        
        */
        
        
        this.service = new Service.AccessoryInformation();
        this.service
        .setCharacteristic(Characteristic.Manufacturer, "PlasmaSoft")
        .setCharacteristic(Characteristic.Model, "Generic HTTP Security System")
        .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");
        
        //For an unknown reason the very first status lookup fails
        //Setting an init variable so we know we have just started and can set the states correctly
        this.initialising = true;
        
        //Set all states to closed
        this.currentState = AlarmState.DISARMED;
        this.targetState = AlarmState.DISARMED; 
        this.currentStateString = "Disarmed";
        this.log(" Initial State: Disarmed");

        this.currentAlarmState.updateValue(this.currentState);
        this.targetAlarmState.updateValue(this.targetState);
        
        //Trigger Monitoring
        this.currentStateString = this.monitorAlarmState();
    },
    
    getTargetState: function(callback) {
        
        //GET ALARM STATE
        this.log(this.name + " getTargetState: " + this.alarmStateToString(this.targetState));
        callback(null, this.targetState);
    },
    
    setTargetState: function(state, callback) {
        if(this.currentState != state){
            this.log(this.name + "   currentState: " + this.alarmStateToString(this.currentState));
            this.log(this.name + " setTargetState: " + this.alarmStateToString(state));  
            
                     
            //this.activateAlarm();
            
            //Build Activate Alarm URL from base URL and State
            
            let url = this.activateURL + '/' + this.alarmStateToString(state);
            
            let req = http.get(url, res => {
				let recv_data = '';
				res.on('data', chunk => { recv_data += chunk});
				res.on('end', () => {
					// recv_data contains state info.... {"result":"Success"}
					let result = JSON.parse(recv_data).result;
					this.log('Activate ' + this.name + ' request: ' + result);

				});
			});
			req.on('error', err => {
				this.log("Error in activateAlarm: "+ err.message);
			})
            
            
            
            
            
            this.targetState = state;
            this.targetAlarmState.updateValue(this.targetState);
        } else {
            this.log(this.name + " Ignoring request to " + this.alarmStateToString(state) + " as already in this state");
        }
        
        callback();
        return true;
    },
    
    getState: function(callback) {

        this.log(this.name + " getState: " + this.alarmStateToString(this.currentState));
        
        callback(null, this.currentState);
    },
    
    getServices: function() {
        return [this.service, this.securitySystem];
    }
};
