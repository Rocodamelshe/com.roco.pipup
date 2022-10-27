'use strict';

const Homey = require('homey');
const {PassThrough} = require('stream');
const fetch = require('node-fetch');
const FormData = require('form-data');
const toArray = require('stream-to-array')

class PiPupApp extends Homey.App {

	onInit() {
		this.log('PiPup is running...');

		this._onFlowActionSendNotificationJson = this._onFlowActionSendNotificationJson.bind(this);
		this._onFlowActionSendNotificationMultipart = this._onFlowActionSendNotificationMultipart.bind(this);

		// json

		this.homey.flow.getActionCard('send_notification')
			.registerRunListener(this._onFlowActionSendNotificationJson);

		this.homey.flow.getActionCard('send_notification_media_image')
			.registerRunListener(this._onFlowActionSendNotificationJson);

		this.homey.flow.getActionCard('send_notification_media_video')
			.registerRunListener(this._onFlowActionSendNotificationJson);

		this.homey.flow.getActionCard('send_notification_media_web')
			.registerRunListener(this._onFlowActionSendNotificationJson);

		// multipart

		this.homey.flow.getActionCard('send_notification_image')
			.registerRunListener(this._onFlowActionSendNotificationMultipart);			
	}

	async _onFlowActionSendNotificationJson(args) {
		console.log("send json flow action...")

		try {
			let address = `http://${args.host}:7979/notify`;
			let jsonData = {
				duration: args.time,
				position: args.position,
				title: args.title.trim(),
				titleSize: args.titleSize,
				titleColor: args.titleColor,
				message: args.message.trim(),
				messageSize: args.messageSize,
				messageColor: args.messageColor,
				backgroundColor: args.backgroundColor
			};

			if(args.mediaImageUri) {
				jsonData["media"] = {
					"image": {
						"uri": args.mediaImageUri,
						"width": args.mediaImageWidth
					}
				}
			}

			if(args.mediaVideoUri) {
				jsonData["media"] = {
					"video": {
						"uri": args.mediaVideoUri,
						"width": args.mediaVideoWidth
					}
				}
			}

			if(args.mediaWebUri) {
				jsonData["media"] = {
					"web": {
						"uri": args.mediaWebUri,
						"width": args.mediaWebWidth,
						"height": args.mediaWebHeight
					}
				}
			}

			console.log('sending notification to', address);


			let response = await fetch(address, {
				method: 'POST',
				body: JSON.stringify(jsonData),
				headers: {
					'Content-Type': 'application/json'				
				}
			});

			let responseText = await response.text();
			console.log(`response = ${responseText}`)

			return response.ok;

		} catch(e) {
			console.error(e);
			return false;
		}
	}

	async _onFlowActionSendNotificationMultipart(args) {
		console.log("send multipart flow action...")

		try {

			let address = `http://${args.host}:7979/notify`;
			let formData = {
				imageWidth: args.imageWidth,
				duration: args.time,
				position: args.position,
				title: args.title.trim(),
				titleSize: args.titleSize,
				titleColor: args.titleColor,
				message: args.message.trim(),
				messageSize: args.messageSize,
				messageColor: args.messageColor,
				backgroundColor: args.backgroundColor
			};


			const form = new FormData();
			for(let [key, value] of Object.entries(formData)) {
				form.append(key, value);
			}

			if(args.droptoken != null) {
				const stream = await args.droptoken.getStream();
				// const buffer = await args.droptoken.getBuffer();

				const buffer = await toArray(stream).then(function (parts) {
					const buffers = parts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part));
					return Buffer.concat(buffers);
				})

				form.append('image', buffer, {
					contentType: stream.contentType,
					filename: stream.filename,
					name: 'image',
				});
			}

			console.log('sending notification to', address);

			let response = await fetch(address, {
				method: 'POST',
				body: form,
				headers: { 
					...form.getHeaders() 
				}
			});

			let responseText = await response.text();
			console.log(`response = ${responseText}`)

			return response.ok;

		} catch(e) {
			console.error(e);
			return false;
		}
	}
}

module.exports = PiPupApp;