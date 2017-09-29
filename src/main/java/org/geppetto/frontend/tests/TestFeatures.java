

package org.geppetto.frontend.tests;

import com.google.gson.annotations.SerializedName;

public enum TestFeatures {
	
	@SerializedName("hasInstance")
	HAS_INSTANCE("hasInstance");
	
	private final String text;

    /**
     * @param text
     */
    private TestFeatures(final String text) {
        this.text = text;
    }

    /* (non-Javadoc)
     * @see java.lang.Enum#toString()
     */
    @Override
    public String toString() {
        return text;
    }

	public String getText()
	{
		return text;
	}
    
    
}
