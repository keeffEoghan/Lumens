#pragma once

#include "Def.h"
#include <windows.h>    // windows crap, I need that for the rand() function

class CWeather
{

	int m_windDirection;
	int m_windIntensity;
	int m_windTurbulence;

	int m_rainIntensity;
	
	int m_waveDirection;
	float m_waveIntensity;
	int m_waveTurbulence;
	bool m_deepWaves;

public:

	CWeather(void);
	virtual ~CWeather(void);

	void applyWind(float *u, float *v);
	void applyRain(float *d, float *u, float *v);
	void applyWaves(float *d, float *u, float *v);

	void intensityIncreace(bool increace) {if(increace) m_rainIntensity++; else if(m_rainIntensity - 1 > 0) m_rainIntensity--;}
	int getWindDirection(void)	{ return m_windDirection; }
};