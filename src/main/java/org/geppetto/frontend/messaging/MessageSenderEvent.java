
package org.geppetto.frontend.messaging;

import java.util.EventObject;

public class MessageSenderEvent extends EventObject {

	private Type type = Type.MESSAGE_SEND_FAILED;

	public static enum Type {
		MESSAGE_SEND_FAILED
	}

	public MessageSenderEvent(Object source, Type type) {
		super(source);
		this.type = type;
	}

	public Type getType() {
		return type;
	}

	public void setType(Type type) {
		this.type = type;
	}
}
