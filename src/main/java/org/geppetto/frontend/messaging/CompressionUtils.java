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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * Some utilities for compressing strings and byte arrays via Gzip.
 */
public class CompressionUtils {

    private static Log logger = LogFactory.getLog(CompressionUtils.class);

    public static byte[] gzipCompress(String message) throws IOException {

        long startTime = System.currentTimeMillis();

        ByteArrayOutputStream compressedMessageStream = new ByteArrayOutputStream();
        GZIPOutputStream gzipOutputStream = new GZIPOutputStream(compressedMessageStream);

        gzipOutputStream.write(message.getBytes());
        gzipOutputStream.close();

        byte[] compressedMessage = compressedMessageStream.toByteArray();
        compressedMessageStream.close();

        long elapsedTime = System.currentTimeMillis() - startTime;

		logger.debug(String.format("Compressed message from %d to %d bytes in %dms", message.length(),
								   compressedMessage.length, elapsedTime));

        return compressedMessage;
    }

    public static byte[] gzipCompress(byte[] message) throws IOException {

        long startTime = System.currentTimeMillis();

        ByteArrayOutputStream compressedMessageStream = new ByteArrayOutputStream();
        GZIPOutputStream gzipOutputStream = new GZIPOutputStream(compressedMessageStream);

        gzipOutputStream.write(message);
        gzipOutputStream.close();

        byte[] compressedMessage = compressedMessageStream.toByteArray();
        compressedMessageStream.close();

        long elapsedTime = System.currentTimeMillis() - startTime;

		logger.debug(String.format("Compressed message from %d to %d bytes in %dms", message.length,
								   compressedMessage.length, elapsedTime));

        return compressedMessage;
    }
}
