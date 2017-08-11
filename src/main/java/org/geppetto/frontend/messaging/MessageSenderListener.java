
package org.geppetto.frontend.messaging;

import java.util.EventListener;

public interface MessageSenderListener extends EventListener {
	void handleMessageSenderEvent(MessageSenderEvent event);
}
