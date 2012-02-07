#include ".\ship.h"

extern N;

CShip::CShip(void)
{	
	// Position
	m_fX = 64.0f;
	m_fZ = 64.0f;
	m_fY = 0.0f;
	// Measurements
	m_nXLong = 3;
	m_nYLong = 5;
	// Directional Forces
	m_sideways = false;
	m_fXdForce = 0.0f;
	m_fYdForce = 0.0f;
	m_fZdForce = 0.0f;
	// Rotational Forces
	m_bXRoll = false;
	m_fXrForce = 0.0f;
	m_fYrForce = 0.0f;
	m_fZrForce = 0.0f;
	// Weights
	for(int i = 0; i < 5; i++)
	{
		m_fStarboard[i] = 0.0f;
		m_fPort[i]		= 0.0f;
	}
	for(int i = 0; i < 3; i++)
	{
		m_fBow[i]	= 0.0f;
		m_fStern[i] = 0.0f;
	}
	// Sail
	m_fHeading = 0.0f;
	m_fThrust  = 0.0f;
	m_nWindDirection = down;
	m_bSailsDown = false;

	// Scaling and normalizing the ship model
	for(int i = 0; i  < 2333; i++)
	{
		for(int j = 0; j < 3; j++)
			vdata[i][j] *= 0.0035;
		m3dNormalizeVectorf(ndata[i]);
	}
}

CShip::~CShip(void)
{
}

void CShip::resetPos(void)
{
	// Position
	m_fX = 64.0f;
	m_fZ = 64.0f;
	m_fY = 0.0f;
	// Directional Forces
	m_fXdForce = 0.0f;
	m_fYdForce = 0.0f;
	m_fZdForce = 0.0f;
	// Rotational Forces
	m_fXrForce = 0.0f;
	m_fYrForce = 0.0f;
	m_fZrForce = 0.0f;
	// Weights
	for(int i = 0; i < 5; i++)
	{
		m_fStarboard[i] = 0.0f;
		m_fPort[i]		= 0.0f;
	}
	for(int i = 0; i < 3; i++)
	{
		m_fBow[i]	= 0.0f;
		m_fStern[i] = 0.0f;
	}
}

void CShip::render(float dt)
{
	// Spanish Galeon	
	glPushMatrix();
		
		// Transformations (is this the right word? I think)
		glTranslatef((WATER_SCALE/N)*(m_fX), m_fY, (WATER_SCALE/N)*m_fZ);
	    static float sinNumber = 0;
		sinNumber += dt;
		glTranslatef(0.0f, -0.8f + sin(sinNumber)/50, 0.0f);
		glRotatef(90.0f, 1.0f, 0.0f, 0.0f);
		if(m_bXRoll)
			glRotatef(-m_fXrForce, 0.0f, 1.0f, 0.0f);
		else
			glRotatef(m_fXrForce, 0.0f, 1.0f, 0.0f);
		if(m_bZRoll)
			glRotatef(m_fZrForce, 1.0f, 0.0f, 0.0f);
		else
			glRotatef(-m_fZrForce, 1.0f, 0.0f, 0.0f);
		
		// Position light
		glPushMatrix();
			GLfloat someLight[4] = { sin(sinNumber), sin(sinNumber), sin(sinNumber)/10, 1.0f };
			glLightfv(GL_LIGHT1, GL_DIFFUSE, someLight);
			GLfloat whereLight[4] = { 0.0f, 0.0f, 0.0f, 1.0f }; // Point source
			glLightfv(GL_LIGHT1, GL_POSITION, whereLight);
		glPopMatrix();

		glEnableClientState( GL_VERTEX_ARRAY);
		glEnableClientState( GL_NORMAL_ARRAY);
		glVertexPointer(3, GL_FLOAT, 0, vdata);
		glNormalPointer(GL_FLOAT, 0, ndata); // Always has 3 elements

		glFrontFace(GL_CW);
		glColor3f(0.309804f, 0.184314f, 0.184314f);
		glDrawElements( GL_TRIANGLES, 94*3, GL_UNSIGNED_INT, GALLEONAFT_indices);
		glColor3f(0.590000f, 0.410000f, 0.310000f);
		glDrawElements( GL_TRIANGLES, 106*3, GL_UNSIGNED_INT, GALLEONDEC_indices);
		glColor3f(0.309804f, 0.184314f, 0.184314f);
		glDrawElements( GL_TRIANGLES, 300*3, GL_UNSIGNED_INT, GALLEONFLA_indices);
		glColor3f(0.850000f, 0.530000f, 0.100000f);
		glDrawElements( GL_TRIANGLES, 16*3, GL_UNSIGNED_INT, GALLEONLAM_indices);
		glColor3f(0.850000f, 0.530000f, 0.100000f);
		glDrawElements( GL_TRIANGLES, 20*3, GL_UNSIGNED_INT, GALLEONWIN_indices);
		glColor3f(0.309804f, 0.184314f, 0.184314f);
		glDrawElements( GL_TRIANGLES, 970*3, GL_UNSIGNED_INT, GALLEONSMO_indices); // Skeleton

		glRotatef(m_fHeading, 0.0f, 0.0f, 1.0f);

		glColor3f(0.100000f, 0.100000f, 0.100000f);
		glDrawElements( GL_TRIANGLES, 112*3, GL_UNSIGNED_INT, GALLEONRIG_indices); // Ropes
		glColor3f(0.435294f, 0.258824f, 0.258824f);
		glDrawElements( GL_TRIANGLES, 1333*3, GL_UNSIGNED_INT, GALLEONMAS_indices); // Wood
		if(!m_bSailsDown)
		{
			glColor3f(0.847059f, 0.847059f, 0.749020f);
			glDrawElements( GL_TRIANGLES, 1530*3, GL_UNSIGNED_INT, GALLEONSAI_indices); // Kanvas
		}

		glDisableClientState(GL_VERTEX_ARRAY);	
		glDisableClientState(GL_NORMAL_ARRAY);

	glPopMatrix();
}

bool CShip::applyPhysics(float d, float u, float v, int x, int y)
{
	if(m_sideways)
	{
		int oldX = x;
		x = y;
		y = oldX;
	}

	bool midships   = x == (int)m_fX;
	bool starboard  = x == (int)m_fX+1;
	bool port       = x == (int)m_fX-1;

	bool Bulkheads[5];
	Bulkheads[eBow]			= y == (int)m_fZ+2;
	Bulkheads[eBowy]		= y == (int)m_fZ+1;
	Bulkheads[eAmidships]	= y == (int)m_fZ;
	Bulkheads[eSterny]		= y == (int)m_fZ-1;
	Bulkheads[eStern]		= y == (int)m_fZ-2;

	if((midships || starboard || port) && (Bulkheads[eBow] || Bulkheads[eBowy] || Bulkheads[eAmidships] || Bulkheads[eSterny] || Bulkheads[eStern]))
	{
		// Torrent :)
		float absD = abs(d)/100;
		m_fXdForce += u*absD;
		m_fZdForce += v*absD;

		// Roll and Pitch
		if(Bulkheads[eBow])
		{
			if(starboard)
			{
				m_fStarboard[eBow] = m_fBow[eStarboard] = d;
			}
			else if(port)
			{
				m_fPort[eBow] = m_fBow[ePort] = d;
			}
			else if(midships)
			{
				m_fBow[eMidships] = d;
			}
		}
		else if(Bulkheads[eBowy])
		{
			if(starboard)
			{
				m_fStarboard[eBowy]	= m_fBow[eStarboard] = d;
			}
			else if(port)
			{
				m_fPort[eBowy] = m_fBow[ePort] = d;
			}
			else if(midships)
			{
				m_fBow[eMidships] = d;
			}
		}
		else if(Bulkheads[eAmidships])
		{
			if(starboard)
			{
				m_fStarboard[eAmidships] = d;
			}
			else if(port)
			{
				m_fPort[eAmidships]	= d;
			}
			else if(midships)
			{
				// Buoyancy
				m_fYdForce = abs(m_fY) - abs(d);
				if(d < 0)
					m_fYdForce *= -1;
			}
		}
		else if(Bulkheads[eSterny])
		{
			if(starboard)
			{
				m_fStarboard[eSterny] = m_fStern[eStarboard] = d;
			}
			else if(port)
			{
				m_fPort[eSterny] = m_fStern[ePort] = d;
			}
			else if(midships)
			{
				m_fStern[eMidships]	= d;
			}
		}
		else if(Bulkheads[eStern])
		{
			if(starboard)
			{
				m_fStarboard[eStern] = m_fStern[eStarboard]	= d;
			}
			else if(port)
			{
				m_fPort[eStern]	= m_fStern[ePort] = d;
			}
			else if(midships)
			{
				m_fStern[eMidships]	= d;
			}
		}	
		return true;
	}
	return false;
}

void CShip::update(float dt)
{
	// Buoyancy
	m_fY += m_fYdForce/5;

	if(!m_bSailsDown)
	{
		// Force
		m_fX += m_fXdForce/10;
		m_fZ += m_fZdForce/10;
	
		//// Thrust
		//if(m_fHeading < -360 || m_fHeading > 360.0f)
		//	m_fHeading = 0.0f;

		//int dir;
		//if((m_fHeading > -22.5f && m_fHeading < 22.5f)
		//	|| m_fHeading < -337.5f || m_fHeading > 337.5)
		//		dir = up;
		//else
		//	dir = down;
		////if(m_fHeading > 22.5f && m_fHeading < 45.0f)
		////		dir = up;

		//// Control
		//m_fThrust -= 0.1;
		//if(m_fThrust < 0.0f)
		//	m_fThrust = 0.0f;
	
	}

	// Resistnace
	float res = dt;
	float sensitivity = 0.05f;
	if(m_fXdForce > sensitivity)
		m_fXdForce -= res;
	else if(m_fXdForce < -sensitivity)
		m_fXdForce +=res;
	if(m_fZdForce > sensitivity)
		m_fZdForce -= res;
	else if(m_fZdForce < -sensitivity)
		m_fZdForce +=res;

	// Wrap
	if(m_fX > N-5)
		m_fX = 5.0f;
	if(m_fX < 5.0f)
		m_fX = N-5;
	if(m_fZ > N-5)
		m_fZ = 5.0f;
	if(m_fZ < 5.0f)
		m_fZ = N-5;

	// Roll
	float starboardAvrg = 0.0f;
	float portAvrg = 0.0f;
	for(int i = 0; i < 5; i++)
	{
		starboardAvrg	+= m_fStarboard[i];
		portAvrg		+= m_fPort[i];
	}
	starboardAvrg	/= 5;
	portAvrg		/= 5;
	if(starboardAvrg > portAvrg)
	{
		m_bXRoll = true;
		float shouldBe = (starboardAvrg - portAvrg)*100;
		m_fXrForce = shouldBe;
	}
	else
	{	
		m_bXRoll = false;
		float shouldBe = (portAvrg - starboardAvrg)*100;
		m_fXrForce = shouldBe;
	}
	if(m_fXrForce > 90.0f)
		m_fXrForce = 90.0f;

	// Pitch
	float bowAvrg   = 0.0f;
	float sternAvrg = 0.0f;
	for(int i = 0; i < 3; i++)
	{
		bowAvrg	+= m_fBow[i];
		sternAvrg += m_fStern[i];
	}
	bowAvrg	/= 5;
	sternAvrg /= 5;
	if(bowAvrg > sternAvrg)
	{
		m_bZRoll = true; 
		float shouldBe = (bowAvrg - sternAvrg)*100;
		m_fZrForce  = shouldBe;
	}
	else
	{	
		m_bZRoll = false;
		float shouldBe = (sternAvrg - bowAvrg)*100;
		m_fZrForce  = shouldBe;
	}
	if(m_fZrForce > 90.0f)
		m_fZrForce = 90.0f;
}