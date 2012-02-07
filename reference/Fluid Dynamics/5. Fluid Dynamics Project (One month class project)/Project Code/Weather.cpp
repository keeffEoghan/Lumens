#include ".\weather.h"

extern N;

#include <cmath>

CWeather::CWeather(void)
{
	m_windDirection  = down;
	m_windIntensity  = 50;
	m_windTurbulence = 0;

	m_rainIntensity  = 80; // 150;

	m_waveDirection  = right;
	m_waveIntensity  = 0;
	m_waveTurbulence = 5;
	m_deepWaves = false;
}

CWeather::~CWeather(void)
{
}

void CWeather::applyWind(float *u, float *v)
{	
	switch(m_windDirection)
	{
	case center:
		break;
	case up:
		break;
	case rightUp:
		break;
	case right:
		break;
	case down:
		{
			int i = rand() % N;
			int j = rand() % N;

			v[IX(i,j)] -= (rand() % (m_windIntensity + 1)) / 10.0f;
			v[IX(i+1,j+1)] -= (rand() % (m_windIntensity + 1)) / 10.0f;
			v[IX(i,j+2)] -= (rand() % (m_windIntensity + 1)) / 10.0f;
			v[IX(i+1,j+3)] -= (rand() % (m_windIntensity + 1)) / 10.0f;
			v[IX(i,j+4)] -= (rand() % (m_windIntensity + 1)) / 10.0f;
			v[IX(i+1,j+5)] -= (rand() % (m_windIntensity + 1)) / 10.0f;

			if(rand()%2==0)
				u[IX(i,j)] += (rand() % (m_windTurbulence + 1)) / 10.0f;
			else
				u[IX(i,j)] -= (rand() % (m_windTurbulence + 1)) / 10.0f;
		}
		break;
	case leftDown:
		break;
	case left:
		break;
	case leftUp:
		break;
	case rightDown:
		break;
	}
}

void CWeather::applyRain(float *d, float *u, float *v)
{	
	int i = rand() % N;
	int j = rand() % N;

	u[IX(i,j)] -= ((rand() % m_rainIntensity) + 1) / 100.0f;
	v[IX(i,j)] -= ((rand() % m_rainIntensity) + 1) / 100.0f;
	d[IX(i,j)] += ((rand() % m_rainIntensity) + 1) / 100.0f;
}

void CWeather::applyWaves(float *d, float *u, float *v)
{	
	int i, j;
	switch(m_waveDirection)
	{
	case center:
		break;
	case up:
		break;
	case rightUp:
		break;
	case right:
		{
			static float wave;
			wave = sin((float)m_waveIntensity);
			m_waveIntensity += 0.005f;		

			int i = N-1;
			int j = rand() % N + 1;

			for(j = 0; j < N; j++)
			{
				if(m_deepWaves)
					d[IX(i,j)] = (wave)*3;
				else
					d[IX(i,j)] = abs(wave)*2.5;

				float push = -(rand() % m_waveTurbulence);
				u[IX(i,j)] = push;
				//u[IX(i-1,j)] = push;
				//u[IX(i-2,j)] = push;
				//u[IX(i-3,j)] = push;
				//u[IX(i-4,j)] = push;
			}
		}
		break;
	case down:
		break;
	case leftDown:
		break;
	case left:
		break;
	case leftUp:
		break;
	case rightDown:
		break;
	}
}

// TODO    waterfall

// TODO		whirpool