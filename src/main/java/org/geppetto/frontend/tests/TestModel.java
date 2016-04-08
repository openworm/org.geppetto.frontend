package org.geppetto.frontend.tests;

import java.util.List;

public class TestModel
{
	String name;
	String url;
	List<TestFeatures> features;
	
	public String getName()
	{
		return name;
	}
	public void setName(String name)
	{
		this.name = name;
	}
	public String getUrl()
	{
		return url;
	}
	public void setUrl(String url)
	{
		this.url = url;
	}
	public List<TestFeatures> getFeatures()
	{
		return features;
	}
	public void setFeatures(List<TestFeatures> features)
	{
		this.features = features;
	}
	
}
