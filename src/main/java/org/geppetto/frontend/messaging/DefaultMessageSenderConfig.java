package org.geppetto.frontend.messaging;

public class DefaultMessageSenderConfig {

	private int maxQueueSize = 5;
	private boolean discardMessagesIfQueueFull = true;
	private boolean enableCompression = false;

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

	public boolean getEnableCompression() {
		return enableCompression;
	}

	public void setEnableCompression(boolean enableCompression) {
		this.enableCompression = enableCompression;
	}
}
