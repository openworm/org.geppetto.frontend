package org.geppetto.frontend.tests;

import java.util.List;


public class TestModule
{
	String name;
	String description;
	List<TestModel> testModels;
	
	public String getName()
	{
		return name;
	}
	public void setName(String name)
	{
		this.name = name;
	}
	public String getDescription()
	{
		return description;
	}
	public void setDescription(String description)
	{
		this.description = description;
	}
	public List<TestModel> getTestModels()
	{
		return testModels;
	}
	public void setTestModels(List<TestModel> testModels)
	{
		this.testModels = testModels;
	}
	
	
}
