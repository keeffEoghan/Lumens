// StopWatch.h
// Stopwatch class for high resolution timing.
// Code by Richard S. Wright Jr.
// March 23, 1999
// 


#ifndef STOPWATCH_HEADER
#define STOPWATCH_HEADER


///////////////////////////////////////////////////////////////////////////////
// Simple Stopwatch class. Use this for high resolution timing 
// purposes (or, even low resolution timings)
// Pretty self-explanitory.... 
// Reset(), or GetElapsedSeconds().
class CStopWatch
	{
	public:
		CStopWatch(void)	// Constructor
			{
			QueryPerformanceFrequency(&m_CounterFrequency);
			QueryPerformanceCounter(&m_LastCount);
			}

		// Resets timer (difference) to zero
		inline void Reset(void) { QueryPerformanceCounter(&m_LastCount); }					
		
		// Get elapsed time in seconds
		float GetElapsedSeconds(void)
			{
			// Get the current count
			LARGE_INTEGER lCurrent;
			QueryPerformanceCounter(&lCurrent);

			return float((lCurrent.QuadPart - m_LastCount.QuadPart) /
										float(m_CounterFrequency.QuadPart));
			}	
	
	protected:
		LARGE_INTEGER m_CounterFrequency;
		LARGE_INTEGER m_LastCount;
	};


#endif
