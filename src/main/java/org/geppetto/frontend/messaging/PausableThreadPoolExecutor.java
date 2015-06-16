package org.geppetto.frontend.messaging;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class PausableThreadPoolExecutor extends ThreadPoolExecutor {

	private boolean paused = false;
	private ReentrantLock pausedLock = new ReentrantLock(true);
	private Condition pausedCondition = pausedLock.newCondition();
	private static final Log logger = LogFactory.getLog(PausableThreadPoolExecutor.class);

	public PausableThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit,
									  BlockingQueue<Runnable> workQueue, RejectedExecutionHandler handler) {

		super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, Executors.defaultThreadFactory(), handler);
	}

	@Override
	protected void afterExecute(Runnable runnable, Throwable throwable) {

		super.afterExecute(runnable, throwable);

		if (paused) {

			try {

				pausedLock.lockInterruptibly();

				while (paused) {
					pausedCondition.await();
				}

			} catch (InterruptedException e) {
				logger.warn("interrupted waiting on paused thread pool");

			} finally {
				pausedLock.unlock();
			}
		}
	}

	public void setPaused(boolean paused) {

		this.paused = paused;

		if (!paused) {

			try {

				pausedLock.lockInterruptibly();
				pausedCondition.signalAll();

			} catch (InterruptedException e) {
				logger.warn("interrupted trying to signal threads that they can resume");

			} finally {
				pausedLock.unlock();
			}
		}
	}

	public boolean isPaused() {
		return paused;
	}
}
