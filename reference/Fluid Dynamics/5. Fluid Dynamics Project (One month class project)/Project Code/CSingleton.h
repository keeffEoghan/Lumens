/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File:	"CSingleton.h"
//
// Author: Lou Hayt (LH)
// 
// Purpose: A nice way to make easy singletons (should be used in all manager class')
//
// Usage: Publicly derive (don't forget the <Name of Your Class> template thing)
//		  Make it a friend
//		  Move the default constructor to the private section
//		  Write dummie copy constructor and assigment operator functions in the private section
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#pragma once

template <class T>
class CSingleton
{

private:

	static T m_instance;

protected:

	CSingleton(void) {}

public:

	virtual ~CSingleton(void) {}

	//////////////////////////////////////////////////////////////////////////
	// Function		:	get
	//
	// Purpose		:	returns a reference to the singleton
	//////////////////////////////////////////////////////////////////////////
	inline static T &get(void) { return m_instance; }

};

template <class T>
T CSingleton<T>::m_instance;