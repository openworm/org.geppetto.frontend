package org.geppetto.frontend;

import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;

public class ApplicationListenerBean implements ApplicationListener<ContextRefreshedEvent>
{
	@Override
	public void onApplicationEvent(ContextRefreshedEvent event)
	{
		// DONT'DO ANYTHING THAT HAS TO DO WITH THE DATABASE HERE OR DATANUCLEUS BREAKS
	}
}