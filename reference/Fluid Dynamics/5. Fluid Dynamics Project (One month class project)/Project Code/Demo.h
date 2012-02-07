#pragma once

#include <windows.h>    // windows crap
#include <gl/gl.h>      // openGL 1.1
#include <gl/glu.h>     // openGL utilities
#include <gl/glut.h>    // openGL toolkit for demos
#include "Def.h"	    // definitions
#include "CSingleton.h" // singleton tamplate
#include <glFrame.h>    // Richard's frame class
#include <stopWatch.h>  // Richard's time class
#include <glSphere.h>   // Richard's sphere class
#include <ctime>		// randomize seed
#include "TeaPot.h"		// The flying teapot from planet Gong
#include <stdio.h>		// using sprintf for the fps timer display
#include "Ship.h"
#include "Weather.h"

extern N;

class CDemo :
	public CSingleton<CDemo>
{
private:

	friend CSingleton<CDemo>;

	CDemo(void);
	CDemo(const CDemo&);
	CDemo&operator = (const CDemo&);

private:

	CStopWatch	m_watch;
	CStopWatch fpsTimer;
	GLFrame		m_camera;
	//CTeaPot	m_teaPot;
	CShip		m_ship;
	CWeather	m_weather;

	// Per second timer
	float	m_dt;
	float	m_lastTime;
	float   m_decay;

	// Weather
	bool	m_bDrawRain;
	float	m_rainTimer;
	float	m_rainTimerSpacing;
	bool	m_bDrawWind;
	float	m_windTimer;
	float	m_windTimerSpacing;
	bool	m_bDrawWaves;
	float	m_wavesTimer;
	float	m_wavesTimerSpacing;

	// Rendering arrays
	GLfloat vData[A_SIZE][3];
	GLfloat nData[A_SIZE][3];
	GLfloat cData[A_SIZE][3];
	GLint	iData[A_SIZE][6];

	// Fluid Simulation Variables
	float	m_diff;
	float	m_visc;
	float	m_force;
	float	m_source;
	bool	m_bDrawVelocity;
	bool	m_bDraw3d;
	bool	m_bDrawTeaPot;
	bool	m_bLights;
	bool	m_bWireFrame;

	float *m_u;
	float *m_v;
	float *m_u_prev;
	float *m_v_prev;
	float *m_dens;
	float *m_dens_prev;
	int    m_cursorX;
	int    m_cursorY;

	float m_decayRate;

	// Color Schemes
	tColorScheme m_colors[2];
	tColor		 m_backgroundColor;
	int m_colorShceme;

public:

	// Mouse
	int mouse_down[3];
	int omx, omy, mx, my;

	~CDemo(void);
	void freeFluid(void);
	void clearFluid(void);
	int  allocateFluid(void);

	void render(void);
	void idle(void);
	void keyboardInput(void);
	tColor colorLerp(tColor start, tColor end, float range);
	void thinOut(void);
	void injectDensity(void);
	void injectDensityHelper(int i, int j, float x);
	void injectVelocity(void);
	void changeColorScheme(void);
	void toggleWireFrame(void);
	void drawSphere(float scale = 0.1f);
	void get_from_UI ( float * d, float * u, float * v );

	// Rendering
	void setIndices(void);
	void updateRenderingArrays(void);

	// Weather
	void rainIntensityIncreace(bool increace);
	void rainSpreadIncreace(bool increace);
	void rainToggle(void) { m_bDrawRain = !m_bDrawRain; }
	int getWindDirection(void)	{ return m_weather.getWindDirection(); }

	// Ship
	void changeHeading(float there)	{ m_ship.changeHeading(there); }
	void engage(float go)			{ m_ship.engage(go); }
	void toTheSails(void)			{ m_ship.toTheSails(); }

public:

	////////////////////////////////////////////////////////////////
	// Fluid Draw Functions	
	void draw_fluid  ( void );

	////////////////////////////////////////////////////////////////
	// Solver Functions
	void add_source	( int N, float * x, float * s, float dt );
	void set_bnd	( int N, int b, float * x );
	void lin_solve	( int N, int b, float * x, float * x0, float a, float c );
	void diffuse	( int N, int b, float * x, float * x0, float diff, float dt );
	void advect		( int N, int b, float * d, float * d0, float * u, float * v, float dt );
	void project	( int N, float * u, float * v, float * p, float * div );
	void dens_step	( int N, float * x, float * x0, float * u, float * v, float diff, float dt );
	void vel_step	( int N, float * u, float * v, float * u0, float * v0, float visc, float dt );
};
