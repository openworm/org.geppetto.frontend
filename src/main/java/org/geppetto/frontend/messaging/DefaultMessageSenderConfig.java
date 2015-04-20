package org.geppetto.frontend.messaging;

public class DefaultMessageSenderConfig {

	private boolean queuingEnabled = false;
	private int maxQueueSize = 5;
	private boolean discardMessagesIfQueueFull = true;
	private boolean compressionEnabled = false;
	private int minMessageLengthForCompression = 20000;

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

	public String toString() {
		return String.format("queuing enabled = %b, compression enabled = %b", queuingEnabled, compressionEnabled);
	}
}
