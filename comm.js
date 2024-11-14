/*!
 * comm
 * Copyright(c) 2023 Sulistyo Ponco Nugroho
 * - Licensed
 */

'use strict';

const ModbusRTU = require ('modbus-serial');
const dgram = require ('dgram');

class Comm {
	static STATE_INIT			= 'State init';
	static STATE_IDLE			= 'State idle';
	static STATE_NEXT			= 'State next';
	static STATE_GOOD_READ		= 'State good (read)';
	static STATE_FAIL_READ		= 'State fail (read)';
	static STATE_GOOD_CONNECT	= 'State good (port)';
	static STATE_FAIL_CONNECT	= 'State fail (port)';

	static TYPE_MODBUS_UDP		= 'type MODBUS UDP';
	static TYPE_MODBUS_TCP		= 'type MODBUS TCP';
	static TYPE_UDP				= 'type UDP';
	
	constructor(id, type, host, port, addr=1, len=125) {
		
		this._type		= type;
		
		switch (this._type)
		{
			case Comm.TYPE_MODBUS_UDP:
			case Comm.TYPE_MODBUS_TCP:
				this._client = new ModbusRTU();
				break;
				
			case Comm.TYPE_UDP:
				this._client = dgram.createSocket('udp4');
				break;

			default:
		}
		
		this._id		= id;
		this._host		= host;
		this._port		= port;
		this._address	= addr;
		this._length	= len;
		
		this._scantime	= 500;
		this._timeout	= 5000;
		this._timer		= null;
	
		this._state			= Comm.STATE_INIT;
		this._isConnected	= false;
		this._message		= 'Initializing...';
		this._data			= [];
	}
	
	getData() {
		return { 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data };
	}
	
	connectModbusClient() {
		return new Promise((resolve, reject) => {
			
			this._client.close(function() {});

			this._client.setID      (this._id);
			this._client.setTimeout (this._timeout);
			
			switch (this._type)
			{
				case Comm.TYPE_MODBUS_UDP:
					this._client.connectUDP (this._host, { port: this._port })
						.then(() => {
							this._isConnected	= false;
							this._state 		= Comm.STATE_GOOD_CONNECT;
							this._message		= 'Connected';
							resolve({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
						})
						.catch((e) => {
							this._isConnected	= false;
							this._state			= Comm.STATE_FAIL_CONNECT;
							this._message		= e.message;
							reject({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
						});
					break;

				case Comm.TYPE_MODBUS_TCP:
					this._client.connectTCP (this._host, { port: this._port })
						.then(() => {
							this._isConnected	= false;
							this._state			= Comm.STATE_GOOD_CONNECT;
							this._message		= 'Connected';
							resolve({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
						})
						.catch((e) => {
							this._isConnected	= false;
							this._state			= Comm.STATE_FAIL_CONNECT;
							this._message		= e.message;
							reject({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
						});
					break;

				default:
			}
		
		});
	}
	
	readModbusData() {
		return new Promise((resolve, reject) => {
	
			let lastData = [];
			this.readModbusHoldingRegisters (this._client, this._address, this._length, lastData)
			.then((data) => {
				this._isConnected	= true;
				this._state			= Comm.STATE_GOOD_READ;
				this._message		= 'Data has been collected';
				this._data			= data;
				resolve({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
			})
			.catch((e) => {
				this._isConnected	= false;
				this._state			= Comm.STATE_FAIL_READ;
				this._message		= e.message;
				reject({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
			});
		
		});
	}
	
	readModbusHoldingRegisters(client, addr, len, lastData) {
		return new Promise((resolve, reject) => {
			
			const currentLen = (len < 125) ? len : 125;
			if (currentLen <= 0) {
				resolve(lastData);
			} else {
				client.readHoldingRegisters(addr, currentLen)
					.then((data) => {
						lastData = lastData.concat(data.data);
						this.readModbusHoldingRegisters(client, addr + 125, len - 125, lastData)
						.then(resolve)
						.catch(reject);
					})
					.catch(reject);
			}
			
		});
	}
	
	nextModbusStep() {
		return new Promise((resolve, reject) => {
			
			switch (this._state)
			{
				case Comm.STATE_INIT:
					this.connectModbusClient()
					.then(resolve)
					.catch(reject);
					this._state = Comm.STATE_IDLE;
					break;

				case Comm.STATE_NEXT:
					this.readModbusData()
					.then(resolve)
					.catch(reject);
					this._state = Comm.STATE_IDLE;
					break;

				case Comm.STATE_GOOD_CONNECT:
					this.readModbusData()
					.then(resolve)
					.catch(reject);
					this._state = Comm.STATE_IDLE;
					break;

				case Comm.STATE_FAIL_CONNECT:
					this.connectModbusClient()
					.then(resolve)
					.catch(reject);
					this._state = Comm.STATE_IDLE;
					break;

				case Comm.STATE_GOOD_READ:
					this.readModbusData()
					.then(resolve)
					.catch(reject);
					this._state = Comm.STATE_IDLE;
					break;

				case Comm.STATE_FAIL_READ:
					if (this._client.isOpen) {
						this._state = Comm.STATE_NEXT;
					} else {
						this.connectModbusClient()
						.then(resolve)
						.catch(reject);
						this._state = Comm.STATE_IDLE;
					}
					break;

				default:
					// nothing to do, keep scanning until actionable case
			}
		});
		
	}
	
	setUdpTimer(callback) {
		return setTimeout(() => {
			this._isConnected	= false;
			this._state			= Comm.STATE_FAIL_READ;
			this._message		= 'Request timeout';
			callback({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
		}, this._timeout);
	}
	
	connectUdpClient(callback) {
		this._client.on('listening', () => {
			this._isConnected	= false;
			this._state			= Comm.STATE_GOOD_CONNECT;
			this._message		= 'Connected';
			callback({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
		});
		this._client.on('error', (e) => {
			this._isConnected	= false;
			this._state			= Comm.STATE_FAIL_READ;
			this._message		= e.message;
			callback({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
		})
		this._client.on('message', (message, rinfo) => {
			if (rinfo.address != this._host) return;
			clearTimeout(this._timer);
			this._timer			= this.setTimer(callback);
			this._isConnected	= true;
			this._state			= Comm.STATE_GOOD_READ;
			this._message		= 'Data has been collected';
			this._data			= message.toString();
			callback({ 'isConnected' : this._isConnected, 'message' : this._message, 'data' : this._data });
			//console.log('client received message: ' + message + ' from ' + rinfo.address+ ':' + rinfo.port);
		});
		this._client.bind(this._port);
		
		this._timer = this.setTimer(callback);
	}
	
	
	run(callback) {
		
		switch (this._type)
		{
			case Comm.TYPE_MODBUS_UDP:
			case Comm.TYPE_MODBUS_TCP:
				setInterval(() => {
					this.nextModbusStep()
					.then(callback)
					.catch(callback);
				}, this._scantime);
				break;

			case Comm.TYPE_UDP:
				this.connectUdpClient(callback);
				break;

			default:
		}
		
	}
	
}

module.exports = Comm;

// const comm = new Comm(1, Comm.TYPE_MODBUS_UDP, '10.10.3.132', 502, 18, 272);
// const comm = new Comm(1, Comm.TYPE_MODBUS_TCP, '10.10.3.132', 502, 18, 272);
// const comm = new Comm(1, Comm.TYPE_UDP, '10.10.8.99', 2371);

// comm.run((data) => {
	// console.log(data);
// });