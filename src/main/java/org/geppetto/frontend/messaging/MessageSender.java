
package org.geppetto.frontend.messaging;

import java.nio.file.Path;
import org.geppetto.frontend.messages.OutboundMessages;

public interface MessageSender
{
	void addListener(MessageSenderListener listener);

	void removeListener(MessageSenderListener listener);

	void sendMessage(String requestID, OutboundMessages type, String update);

	void sendFile(Path path);

	void pause();

	void resume();

	void reset();

	void shutdown();
}
