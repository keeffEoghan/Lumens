#pragma once

#include <windows.h>    // windows crap
#include <gl/gl.h>      // openGL 1.1
#include <gl/glu.h>     // openGL utilities
#include <gl/glut.h>    // openGL toolkit for demos
#include "Def.h"	    // definitions

class CTeaPot
{

private:

	float m_x;
	float m_y;
	float m_z;
	
	float m_vx;
	float m_vy;
	float m_vz;

	float	m_angle;

public:

	CTeaPot(void);
	virtual ~CTeaPot(void);

	void render(float dt);
	void applyPhysics(float d, float u, float v, float x, float y);

	void resetPos(void)	{ 
	m_x = (20.0f / 64) * 32;
	m_y = 0.0f;
	m_z = (20.0f / 64) * 32;
	m_vx = 0.0f;
	m_vy = 0.0f;
	m_vz = 0.0f;}

};
