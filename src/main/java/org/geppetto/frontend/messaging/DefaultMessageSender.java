/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011 - 2015 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *     	OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
package org.geppetto.frontend.messaging;

import com.google.gson.Gson;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.apache.catalina.websocket.WsOutbound;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geppetto.frontend.GeppettoTransportMessage;
import org.geppetto.frontend.OUTBOUND_MESSAGE_TYPES;
import org.geppetto.frontend.TransportMessageFactory;

public class DefaultMessageSender implements MessageSender {

	private ArrayBlockingQueue<Runnable> preprocessorQueue;
	private ThreadPoolExecutor preprocessorExecutor;
	private ArrayBlockingQueue<Runnable> senderQueue;
	private ThreadPoolExecutor senderExecutor;
	private WsOutbound wsOutbound;
	private Set<MessageSenderListener> listeners = new HashSet<>();
	private DefaultMessageSenderConfig config = new DefaultMessageSenderConfig();

	private static final Log logger = LogFactory.getLog(DefaultMessageSender.class);

	public DefaultMessageSender(WsOutbound wsOutbound, DefaultMessageSenderConfig config) {

		this.config = config;
		logger.info("Creating default message sender - " + config);
		this.wsOutbound = wsOutbound;

		if (config.isQueuingEnabled()) {

			RejectedExecutionHandler rejectedExecutionHandler;

			if (config.getDiscardMessagesIfQueueFull()) {
				rejectedExecutionHandler = new ThreadPoolExecutor.DiscardOldestPolicy();
			} else {
				rejectedExecutionHandler = new ThreadPoolExecutor.CallerRunsPolicy();
			}

			preprocessorQueue = new ArrayBlockingQueue<>(config.getMaxQueueSize());

			preprocessorExecutor = new ThreadPoolExecutor(1, 1, 10, TimeUnit.SECONDS, preprocessorQueue,
														  rejectedExecutionHandler);

			senderQueue = new ArrayBlockingQueue<>(config.getMaxQueueSize());
			senderExecutor = new ThreadPoolExecutor(1, 1, 10, TimeUnit.SECONDS, senderQueue, rejectedExecutionHandler);
		}
	}

	public void shutdown() {
		logger.info("Shutting down default message sender");
		if (preprocessorExecutor != null) {
			preprocessorExecutor.shutdownNow();
		}
		if (senderExecutor != null) {
			senderExecutor.shutdownNow();
		}
	}

	@Override
	public void addListener(MessageSenderListener listener) {
		listeners.add(listener);
	}

	@Override
	public void removeListener(MessageSenderListener listener) {
		listeners.remove(listener);
	}

	private void notifyListeners(MessageSenderEvent.Type eventType) {
		for (MessageSenderListener listener : listeners) {
			listener.handleMessageSenderEvent(new MessageSenderEvent(this, eventType));
		}
	}

	@Override
	public void sendMessage(String requestID, OUTBOUND_MESSAGE_TYPES type, String update) {

		if (config.isQueuingEnabled()) {
			preprocessorExecutor.execute(new Preprocessor(requestID, type, update));

		} else {

			try {

				String message = preprocessMessage(requestID, type, update);

				if (!config.isCompressionEnabled() || message.length() < config.getMinMessageLengthForCompression()) {
					new TextMessageSender(message).run();

				} else {
					byte[] compressedMessage = CompressionUtils.gzipCompress(message);
					new BinaryMessageSender(compressedMessage).run();
				}

			} catch (IOException e) {
				logger.warn("failed to send binary message", e);
				notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
			}
		}
	}

	private String preprocessMessage(String requestId, OUTBOUND_MESSAGE_TYPES type, String update) {

		long startTime = System.currentTimeMillis();

		GeppettoTransportMessage transportMessage =
				TransportMessageFactory.getTransportMessage(requestId, type, update);

		logger.debug(String.format("created transport message in %dms",
								   System.currentTimeMillis() - startTime));

		startTime = System.currentTimeMillis();
		String message = new Gson().toJson(transportMessage);
		logger.debug(String.format("created json in %dms", System.currentTimeMillis() - startTime));

		return message;
	}

	public DefaultMessageSenderConfig getConfig() {
		return config;
	}

	public void setConfig(DefaultMessageSenderConfig config) {
		this.config = config;
	}

	private class TextMessageSender implements Runnable {

		private String message;

		public TextMessageSender(String message) {
			this.message = message;
		}

		public void run() {

			try {

				long startTime = System.currentTimeMillis();
				CharBuffer buffer = CharBuffer.wrap(message);
				wsOutbound.writeTextMessage(buffer);

				logger.info(String.format("%dms were spent sending a message of %dKB to the client",
										  System.currentTimeMillis() - startTime, message.length() / 1024));

			} catch (IOException e) {
				logger.warn("failed to send message", e);
				notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
			}
		}
	}

	private class BinaryMessageSender implements Runnable {

		private byte[] message;

		public BinaryMessageSender(byte[] message) {
			this.message = message;
		}

		public void run() {

			try {

				long startTime = System.currentTimeMillis();
				ByteBuffer buffer = ByteBuffer.wrap(message);
				wsOutbound.writeBinaryMessage(buffer);

				logger.info(String.format("%d ms were spent sending a binary/compressed message of %dKB to the client",
										  System.currentTimeMillis() - startTime, message.length / 1024));

			} catch (IOException e) {
				logger.warn("failed to send binary message", e);
				notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
			}
		}
	}

	private class Preprocessor implements Runnable {

		private String requestId;
		private OUTBOUND_MESSAGE_TYPES type;
		private String update;

		public Preprocessor(String requestId, OUTBOUND_MESSAGE_TYPES type, String update) {
			this.requestId = requestId;
			this.type = type;
			this.update = update;
		}

		public void run() {

			try {

				String message = preprocessMessage(requestId, type, update);

				if (!config.isCompressionEnabled() || message.length() < config.getMinMessageLengthForCompression()) {
					senderExecutor.execute(new TextMessageSender(message));

				} else {
					byte[] compressedMessage = CompressionUtils.gzipCompress(message);
					senderExecutor.execute(new BinaryMessageSender(compressedMessage));
				}

			} catch (IOException e) {
				logger.warn("failed to process message before transmission", e);
				notifyListeners(MessageSenderEvent.Type.MESSAGE_SEND_FAILED);
			}
		}
	}
}
