#pragma once

#include <windows.h>    // windows crap
#include <gl/gl.h>      // openGL 1.1
#include <gl/glu.h>     // openGL utilities
#include <gl/glut.h>    // openGL toolkit for demos
#include "Def.h"	    // definitions
#include "ShipData.h"	// model data
#include "Math3d.h"		// Richard's stuff

class CShip
{

private:

	// Position
	float m_fX;
	float m_fZ;
	float m_fY;
	// Measurements
	int m_nXLong;
	int m_nYLong;
	// Directional Forces
	bool  m_sideways;
	float m_fXdForce;
	float m_fYdForce;
	float m_fZdForce;
	// Rotational Forces
	float m_fXrForce;
	float m_fYrForce;
	float m_fZrForce;
	// Weights
	bool  m_bXRoll;
	float m_fStarboard[5];
	float m_fPort[5];
	bool  m_bZRoll;
	float m_fBow[3];
	float m_fStern[3];
	// Sail
	float m_fHeading;
	float m_fThrust;
	int   m_nWindDirection;
	bool  m_bSailsDown;

public:

	enum eShipLong{eBow = 0, eBowy, eAmidships, eSterny, eStern};
	enum eShipWide{eStarboard = 0, eMidships, ePort};
	
	CShip(void);
	virtual ~CShip(void);
	
	void render(float dt);
	bool applyPhysics(float d, float u, float v, int x, int y);
	void update(float dt);
	void resetPos(void);

	void changeHeading(float there)	{ m_fHeading+=there; }
	void engage(float go)			{ m_fThrust += go; }
	void toTheSails(void)			{ m_bSailsDown = !m_bSailsDown; }
};
