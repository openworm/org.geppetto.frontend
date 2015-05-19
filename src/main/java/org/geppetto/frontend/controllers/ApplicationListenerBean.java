package org.geppetto.frontend.controllers;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextStartedEvent;

public class ApplicationListenerBean implements ApplicationListener<ContextStartedEvent>
{
	private static Log _logger = LogFactory.getLog(ApplicationListenerBean.class);

	@Override
	public void onApplicationEvent(ContextStartedEvent event)
	{
		new ExperimentRunManager();
		_logger.info("Experiment run manager started");
	}
}