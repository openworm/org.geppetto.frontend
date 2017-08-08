
package org.geppetto.frontend.messaging;

import java.util.Set;

import org.apache.catalina.websocket.WsOutbound;
import org.geppetto.frontend.messages.OutboundMessages;

public class DefaultMessageSenderFactory {

	private boolean queuingEnabled = false;
	private int maxQueueSize = 5;
	private boolean discardMessagesIfQueueFull = true;
	private boolean compressionEnabled = false;
	private int minMessageLengthForCompression = 20000;
	private Set<OutboundMessages> queuedMessageTypes;

	public DefaultMessageSender getMessageSender(WsOutbound wsOutbound, MessageSenderListener listener) {

		DefaultMessageSender messageSender = new DefaultMessageSender();
		messageSender.addListener(listener);

		messageSender.setQueuingEnabled(queuingEnabled);
		messageSender.setMaxQueueSize(maxQueueSize);
		messageSender.setDiscardMessagesIfQueueFull(discardMessagesIfQueueFull);
		messageSender.setCompressionEnabled(compressionEnabled);
		messageSender.setMinMessageLengthForCompression(minMessageLengthForCompression);
		messageSender.setQueuedMessageTypes(queuedMessageTypes);

		messageSender.initialize(wsOutbound);

		return messageSender;
	}

	private boolean isQueuedMessageType(OutboundMessages messageType) {
		return queuedMessageTypes != null && queuedMessageTypes.contains(messageType);
	}

	public boolean isCompressionEnabled() {
		return compressionEnabled;
	}

	public void setCompressionEnabled(boolean compressionEnabled) {
		this.compressionEnabled = compressionEnabled;
	}

	public boolean isQueuingEnabled() {
		return queuingEnabled;
	}

	public void setQueuingEnabled(boolean queuingEnabled) {
		this.queuingEnabled = queuingEnabled;
	}

	public int getMaxQueueSize() {
		return maxQueueSize;
	}

	public void setMaxQueueSize(int maxQueueSize) {
		this.maxQueueSize = maxQueueSize;
	}

	public boolean getDiscardMessagesIfQueueFull() {
		return discardMessagesIfQueueFull;
	}

	public void setDiscardMessagesIfQueueFull(boolean discardMessagesIfQueueFull) {
		this.discardMessagesIfQueueFull = discardMessagesIfQueueFull;
	}

	public int getMinMessageLengthForCompression() {
		return minMessageLengthForCompression;
	}

	public void setMinMessageLengthForCompression(int minMessageLengthForCompression) {
		this.minMessageLengthForCompression = minMessageLengthForCompression;
	}

	public Set<OutboundMessages> getQueuedMessageTypes() {
		return queuedMessageTypes;
	}

	public void setQueuedMessageTypes(Set<OutboundMessages> queuedMessageTypes) {
		this.queuedMessageTypes = queuedMessageTypes;
	}
}
