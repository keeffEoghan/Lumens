#include ".\teapot.h"

CTeaPot::CTeaPot(void)
{
	m_x = (20.0f / 64) * 32;
	m_y = 0.0f;
	m_z = (20.0f / 64) * 32;
	
	m_vx = 0.0f;
	m_vy = 0.0f;
	m_vz = 0.0f;
	
	m_angle = 0.0f;
}

CTeaPot::~CTeaPot(void)
{
}

void CTeaPot::render(float dt)
{
	// Boundries
	//if(m_vx > 5.0f)
	//	m_vx = 5.f;
	//if(m_vy > 5.0f)
	//	m_vy = 5.f;
	//if(m_vz > 5.0f)
	//	m_vz = 5.f;
	//if(m_vx < -5.0f)
	//	m_vx = -5.f;
	//if(m_vy < -5.0f)
	//	m_vy = -5.f;
	//if(m_vz < -5.0f)
	//	m_vz = -5.f;
	// Updating
	m_x += m_vx * dt;
	m_y += m_vy * dt;
	m_z += m_vz * dt;

	if(m_x < 0.0f)
		m_x = 20.0f;
	else if(m_x > 20.0f)
		m_x = 0.0f;
	if(m_z < 0.0f)
		m_z = 20.0f;
	else if(m_z > 20.0f)
		m_z = 0.0f;
	if(m_y < -0.5f)
		m_y = -0.5f;
	else if(m_y > 0.5f)
		m_y = 0.5f;
	// Gravity
	m_y -= 0.35f * dt;
	// Friction
	float pull = 0.0f;
	if(m_y < 0.0f)
	{
		pull = m_y * (-20);
	}
	else
	{
		pull = m_y * 20;
	}
	if(m_vx > 0.0f)
		m_vx -= pull * dt;
	else
		m_vx += pull * dt;
	if(m_vz > 0.0f)
		m_vz -= pull * dt;
	else
		m_vz += pull * dt;

	m_angle += 100.0f * dt;
	
	static float rotX = 0.0f;
	static float rotY = 0.0f;
	static float rotZ = 0.0f;
	static float rotXm = 0.0f;
	static float rotYm = 0.0f;
	static float rotZm = 0.0f;

	if(m_x < 0.0f)
	{
		rotXm = 0.5f;
		rotX  = 0.1f;
	}
	else
	{
		rotXm = 0.1f;
		rotX  = 0.5f;
	}

	// Render
	glColor3f(0.95f, 0.1f, 0.25f);
	glTranslatef(m_x, m_y, m_z);
	glRotatef(m_angle, rotX, rotY+0.01f, rotZ);
	glRotatef(-m_angle, rotXm, rotYm+0.01f, rotZm);
	glutSolidTeapot(1.0f);
}
void CTeaPot::applyPhysics(float d, float u, float v, float x, float y)
{
	bool collide = false;

	if(x == (int)(m_x / 20 * 64) && y == (int)(m_z / 20 * 64))
		collide = true;

	if(collide)
	{
		m_vx += u + u*d;
		m_vz += v + v*d;
		m_vy = d;
	}
}