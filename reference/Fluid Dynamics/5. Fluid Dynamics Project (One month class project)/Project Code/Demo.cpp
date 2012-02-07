#include ".\demo.h"

extern N;

CDemo::CDemo(void)
{
	m_dt = m_lastTime = 0.1f;
	
	N		 = 128; //64; //
	m_diff   = 0.0001f;
	m_visc   = 0.0f;
	m_force  = 10.0f;
	m_source = 50.0f;
	m_bDrawVelocity = false;
	m_bDraw3d		= true;
	m_bDrawTeaPot	= false;
	m_bLights		= true;
	m_bWireFrame	= false;
	m_cursorX = m_cursorY = 0.0f;

	m_decay = 0.0f;
	m_decayRate = 0.0001f;

	m_bDrawRain = false;
	m_rainTimer = 0.0f;
	m_rainTimerSpacing	= 64.0f;
	m_bDrawWind = false;
	m_windTimer = 0.0f;
	m_windTimerSpacing	= 250.0f;
	m_bDrawWaves = false;
	m_wavesTimer = 0.0f;
	m_wavesTimerSpacing	= 50.0f;

	m_colorShceme = 1;

	freeFluid();
	allocateFluid();
	clearFluid();

	srand(unsigned int(time(0)));

	m_camera.MoveForward(20.0f);
	m_camera.MoveUp(-15.0f);
	m_camera.MoveRight(20.0f);
	m_camera.RotateLocalX(-24.65f);
	m_camera.RotateLocalY(2.8f);
	m_camera.RotateLocalZ(-9.0f);

	// Here come the Mighty Colors
	m_backgroundColor.red   = 0.3f;
	m_backgroundColor.green = 0.3f;
	m_backgroundColor.blue  = 0.3f;

	// Color Scheme 1
	m_colors[0].DensityLayers[0].red   = 0.5f;
	m_colors[0].DensityLayers[0].green = 0.01f;
	m_colors[0].DensityLayers[0].blue  = 0.02f;
	
	m_colors[0].DensityLayers[1].red   = 0.15f;
	m_colors[0].DensityLayers[1].green = 0.45f;
	m_colors[0].DensityLayers[1].blue  = 0.025f;
	
	m_colors[0].DensityLayers[2].red   = 0.4f;
	m_colors[0].DensityLayers[2].green = 0.02f;
	m_colors[0].DensityLayers[2].blue  = 0.035f;
	
	m_colors[0].DensityLayers[3].red   = 0.25f;
	m_colors[0].DensityLayers[3].green = 0.5f;
	m_colors[0].DensityLayers[3].blue  = 0.1f;
	
	m_colors[0].DensityLayers[4].red   = 0.7f;
	m_colors[0].DensityLayers[4].green = 0.3f;
	m_colors[0].DensityLayers[4].blue  = 0.9f;
	
	m_colors[0].DensityLayers[5].red   = 0.9f;
	m_colors[0].DensityLayers[5].green = 0.5f;
	m_colors[0].DensityLayers[5].blue  = 0.49f;
	
	m_colors[0].VelocityLayer.red   = 0.4f;
	m_colors[0].VelocityLayer.green = 0.65f;
	m_colors[0].VelocityLayer.blue  = 0.85f;
	
	// Color Scheme 2
	m_colors[1].DensityLayers[0].red   = 0.05f;
	m_colors[1].DensityLayers[0].green = 0.15f;
	m_colors[1].DensityLayers[0].blue  = 0.65f;
	
	m_colors[1].DensityLayers[1].red   = 0.8f;
	m_colors[1].DensityLayers[1].green = 0.3f;
	m_colors[1].DensityLayers[1].blue  = 0.55f;
	
	m_colors[1].DensityLayers[2].red   = 0.45f;
	m_colors[1].DensityLayers[2].green = 0.30f;
	m_colors[1].DensityLayers[2].blue  = 0.6f;
	
	m_colors[1].DensityLayers[3].red   = 0.45f;
	m_colors[1].DensityLayers[3].green = 0.36f;
	m_colors[1].DensityLayers[3].blue  = 0.5f;
	
	m_colors[1].DensityLayers[4].red   = 0.12f;
	m_colors[1].DensityLayers[4].green = 0.06f;
	m_colors[1].DensityLayers[4].blue  = 0.36f;
	
	m_colors[1].DensityLayers[5].red   = 0.15f;
	m_colors[1].DensityLayers[5].green = 0.35f;
	m_colors[1].DensityLayers[5].blue  = 0.95f;
	
	m_colors[1].VelocityLayer.red   = 0.4f;
	m_colors[1].VelocityLayer.green = 0.65f;
	m_colors[1].VelocityLayer.blue  = 0.85f;
}

CDemo::~CDemo(void)
{
	freeFluid();
}

void CDemo::freeFluid(void)
{
	if ( m_u ) free ( m_u );
	if ( m_v ) free ( m_v );
	if ( m_u_prev ) free ( m_u_prev );
	if ( m_v_prev ) free ( m_v_prev );
	if ( m_dens )   free ( m_dens );
	if ( m_dens_prev ) free ( m_dens_prev );
}

void CDemo::clearFluid(void)
{
	int i, size=(N+2)*(N+2);

	for ( i=0 ; i<size ; i++ ) {
		m_u[i] = m_v[i] = m_u_prev[i] = m_v_prev[i] = m_dens[i] = m_dens_prev[i] = 0.0f;
	}
}

int CDemo::allocateFluid(void)
{
	int size = (N+2)*(N+2);

	m_u			= (float *) malloc ( size*sizeof(float) );
	m_v			= (float *) malloc ( size*sizeof(float) );
	m_u_prev	= (float *) malloc ( size*sizeof(float) );
	m_v_prev	= (float *) malloc ( size*sizeof(float) );
	m_dens		= (float *) malloc ( size*sizeof(float) );	
	m_dens_prev	= (float *) malloc ( size*sizeof(float) );

	if ( !m_u || !m_v || !m_u_prev || !m_v_prev || !m_dens || !m_dens_prev ) {
		//fprintf ( stderr, "cannot allocate data\n" );
		return ( 0 );
	}

	return ( 1 );
}

void CDemo::render(void)
{	
	// FPS counter
	static float iFrames = 0;

	if(m_bLights)
		glEnable(GL_LIGHTING);
	else
		glDisable(GL_LIGHTING);
	if(m_bWireFrame)
		glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
	else
		glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);

	// Time
	float now = m_watch.GetElapsedSeconds();
	m_dt = (now - m_lastTime);
	m_lastTime = now;

	glPushMatrix(); // Saves the identity matrix
	m_camera.ApplyCameraTransform();

	//// Mouse
	//glPushMatrix();
	//	glTranslatef(m_cursorX / 3.0f - 1.5f, 0.0f, m_cursorY / 3.0f - 1.5f);
	//	drawSphere(0.5f);
	//glPopMatrix();

	// Position light
	glPushMatrix();
		glTranslatef(13.0f, 5.0f, 13.0f);
		GLfloat whereLight[4] = { 0.0f, 0.0f, 0.0f, 1.0f }; // Point source
		glLightfv(GL_LIGHT0, GL_POSITION, whereLight);
		//drawSphere();
	glPopMatrix();

	// Tea Pot
	//if(m_bDrawTeaPot)
	//{
	//	glPushMatrix();
	//		m_teaPot.render(m_dt);
	//	glPopMatrix();
	//}

	// Ship
	//if(m_bDrawTeaPot)
	//{
		glPushMatrix();
			m_ship.render(m_dt);
		glPopMatrix();
	//}

	// Fluid
	glPushMatrix();
		glScalef(WATER_SCALE, 1.0f, WATER_SCALE);
		draw_fluid();
	glPopMatrix();

	glPopMatrix(); // Get rid of the camera

	// FPS counter
	iFrames++;
	if(iFrames == 100)
	{
		// Calculate the frame rate
		float fps = 100.0f / fpsTimer.GetElapsedSeconds();
		char cBuffer[32];
		sprintf(cBuffer, "FPS: %.1f", fps);

		glutSetWindowTitle(cBuffer);

		iFrames = 0;
		fpsTimer.Reset();
	}
}

void CDemo::idle(void)
{
	get_from_UI ( m_dens_prev, m_u_prev, m_v_prev );
	//int size = (N+2)*(N+2);
	//for (int i=0 ; i<size ; i++ )
	//	m_u_prev[i] = m_v_prev[i] = m_dens_prev[i] = 0.0f;

	vel_step ( N, m_u, m_v, m_u_prev, m_v_prev, m_visc, m_dt );
	dens_step ( N, m_dens, m_dens_prev, m_u, m_v, m_diff, m_dt );
}

void CDemo::injectDensity(void)
{
	int i = rand() % N;
	int j = rand() % N;
	float x = (rand() % 100) / 100;

	x+=0.1f;
	injectDensityHelper(i-3,j-3, x);
	injectDensityHelper(i+3,j-3, x);
	injectDensityHelper(i-3,j+3, x);
	injectDensityHelper(i+3,j+3, x);
	x+=0.1f;
	injectDensityHelper(i,j+3, x);
	injectDensityHelper(i+3,j, x);
	injectDensityHelper(i-3,j, x);
	injectDensityHelper(i,j-3, x);
	injectDensityHelper(i,j, x);
}

void CDemo::injectDensityHelper(int i, int j, float x)
{
	int it[totalDirectionCount];
	it[center]		= IX(i,j);
	it[up]			= IX(i-1,j);
	it[rightUp]		= IX(i-1,j+1);
	it[right]		= IX(i,j+1);
	it[down]		= IX(i+1,j);
	it[leftDown]	= IX(i+1,j-1);
	it[left]		= IX(i,j-1);
	it[leftUp]		= IX(i-1,j-1);
	it[rightDown]	= IX(i+1,j+1);
	for(int k = 0; k < 9; k++)
	{
		float *target = &(m_dens[it[k]]);
		if(*target < LIMIT_CUT)
			*target = m_source*sin(x)/2;
	}
}

void CDemo::injectVelocity(void)
{
	m_u[IX(rand() % N, rand() % N)] = m_force * (rand() % 50);
	m_v[IX(rand() % N, rand() % N)] = m_force * (rand() % 50);
}

void CDemo::thinOut(void)
{
	for(int i = 0; i < 1000; i++)
	{
		int x = rand() % N + 1;
		int y = rand() % N + 1;
		float density = m_dens[IX(x, y)];

		float thin = 0.0f;
		if(density < 0.1f)
			thin = 0.01f;
		else if(density < 0.3f)
			thin = 0.1f;
		else if(density < 0.5f)
			thin = 0.2f;
		else if(density < 0.7f)
			thin = 0.3f;
		else if(density < 0.9f)
			thin = 0.4f;
		else if(density > 1.0f)
			m_dens[IX(x, y)] = 0.5f;

		m_dens[IX(x, y)] -= thin;

		if(0.0f > density)
			m_dens[IX(x, y)] = 0.0f;
	}
}

void CDemo::keyboardInput(void)
{
	float linearSpeed = 45.0f * m_dt;
	float rotateSpeed = 65.0f * m_dt;

	if(GetAsyncKeyState(VK_NUMPAD7))
		m_camera.MoveForward(linearSpeed);
		
	if(GetAsyncKeyState(VK_NUMPAD9))
		m_camera.MoveForward(-linearSpeed);
	
	if(GetAsyncKeyState(VK_NUMPAD1))
		m_camera.MoveRight(-linearSpeed);
		
	if(GetAsyncKeyState(VK_NUMPAD3))
		m_camera.MoveRight(linearSpeed);

	if(GetAsyncKeyState(VK_MULTIPLY))
		m_camera.RotateLocalZ(m3dDegToRad(rotateSpeed));
		
	if(GetAsyncKeyState(VK_DIVIDE))
		m_camera.RotateLocalZ(m3dDegToRad(-rotateSpeed));
	 
	if(GetAsyncKeyState(VK_NUMPAD4) || GetAsyncKeyState(VK_LEFT))
		m_camera.RotateLocalY(m3dDegToRad(rotateSpeed));
	
	if(GetAsyncKeyState(VK_NUMPAD6) || GetAsyncKeyState(VK_RIGHT))
		m_camera.RotateLocalY(m3dDegToRad(-rotateSpeed));

	if(GetAsyncKeyState(VK_NUMPAD2) || GetAsyncKeyState(VK_UP))
		m_camera.RotateLocalX(m3dDegToRad(rotateSpeed));
	
	if(GetAsyncKeyState(VK_NUMPAD8) || GetAsyncKeyState(VK_DOWN))
		m_camera.RotateLocalX(m3dDegToRad(-rotateSpeed));

	if(GetAsyncKeyState(VK_NUMPAD5) || GetAsyncKeyState(VK_RSHIFT))
		m_camera.MoveUp(linearSpeed);
	
	if(GetAsyncKeyState(VK_NUMPAD0) || GetAsyncKeyState(VK_RCONTROL))
		m_camera.MoveUp(-linearSpeed);

	if(GetAsyncKeyState(VK_ADD))
		m_bDraw3d = !m_bDraw3d;
	if(GetAsyncKeyState(VK_SUBTRACT))
	{		
		m_ship.resetPos();
		//m_teaPot.resetPos();
		//m_bDrawTeaPot = !m_bDrawTeaPot;

		//m_bDrawWind  = !m_bDrawWind;
		m_bDrawWaves = !m_bDrawWaves;
	}
	
	if(GetAsyncKeyState(VK_DECIMAL))
		m_bLights = !m_bLights;
	
	if(GetAsyncKeyState(VK_BACK))
		m_bDrawVelocity = !m_bDrawVelocity;
}

void CDemo::get_from_UI ( float * d, float * u, float * v )
{
	int i, j, size = (N+2)*(N+2);

	for ( i=0 ; i<size ; i++ ) {
		u[i] = v[i] = d[i] = 0.0f;
	}

	if ( !mouse_down[0] && !mouse_down[2] ) return;

	m_cursorX = ((       mx /(float)WINDOW_WIDTH)*N+1);
	m_cursorY = (((WINDOW_HEIGHT-my)/(float)WINDOW_HEIGHT)*N+1);
	i = (int)m_cursorX;
	j = (int)m_cursorY;

	if ( i<1 || i>N || j<1 || j>N ) return;

	if ( mouse_down[0] ) {
		u[IX(i,j)] = m_force * (mx-omx);
		v[IX(i,j)] = m_force * (omy-my);
	}

	if ( mouse_down[2] ) 
	{
		int it[3];
		it[0]	= IX(i,j);   // center
		it[1]	= IX(i,j+1); // right
		it[2]	= IX(i+1,j); // down
		for(int k = 0; k < 3; k++)
			d[it[k]] = m_source;
	}

	omx = mx;
	omy = my;

	return;
}

void CDemo::changeColorScheme(void)
{
	m_colorShceme++;
	if(m_colorShceme >= NUM_COLOR_SCHEMES)
		m_colorShceme = 0;
}

////////////////////////////////////////////////////////////////
// Fluid Draw Functions

void CDemo::draw_fluid ( void )
{
	int i, j;
	float x, y, h;

	// Spacing, the distance between the centers of two adjacent grid squares
	h = 1.0f/N;

	// Velocity
	glColor3f ( 0.0f, 0.0f, 1.0f );
	glLineWidth ( 1.0f );
	if(m_bDrawVelocity)
	{
		glBegin ( GL_LINES );

			for ( i=1 ; i<=N ; i++ ) 
			{
				x = (i-0.5f)*h;
				for ( j=1 ; j<=N ; j++ ) 
				{
					y = (j-0.5f)*h;

					//float Uf = abs(m_u[IX(i,j)]);
					//float Vf = abs(m_v[IX(i,j)]);		
					//tColor color;
					//color.blue = color.green = color.red = 0.0f;
					//color = colorLerp( color,  m_colors[m_colorShceme].VelocityLayer, Uf / 10);		
					//color = colorLerp( color,  m_colors[m_colorShceme].VelocityLayer, Vf / 10);	
					//glColor3f ( color.red, color.green, color.blue );
					glVertex3f ( x, 0.0f, y );
					glVertex3f ( x+m_u[IX(i,j)], 0.0f, y+m_v[IX(i,j)] );
				}
			}

		glEnd ();
	}

	updateRenderingArrays();

	glEnableClientState( GL_VERTEX_ARRAY);
	glEnableClientState( GL_NORMAL_ARRAY);
	glEnableClientState( GL_COLOR_ARRAY);

	glVertexPointer(3, GL_FLOAT, 0, vData);
	glNormalPointer(GL_FLOAT, 0, nData); // Always has 3 elements
	glColorPointer(3, GL_FLOAT, 0, cData);
	glPushMatrix();
		glDrawElements( GL_TRIANGLES, A_SIZE*6, GL_UNSIGNED_INT, iData);	
	glPopMatrix();

	glDisableClientState(GL_VERTEX_ARRAY);	
	glDisableClientState(GL_NORMAL_ARRAY);
	glDisableClientState(GL_COLOR_ARRAY);
}

void CDemo::updateRenderingArrays(void)
{
	int i, j;
	float x, y, h;

	// Spacing, the distance between the centers of two adjacent grid squares
	h = 1.0f/N;

	for (i = 0; i <= N; i++) 
	{
		x = (i - 0.5f)*h;
		for (j = 0; j <= N; j++) 
		{
			y = (j - 0.5f)*h;

			// i-1 - up
			// i   - center
			// i+1 - down
			// j+1 - right
			// j   - center
			// j-1 - left

			// Setting the index
			int it[totalIndexCount];
			it[center]		= IX(i,j);
			// These are for the normals
			it[up]			= IX(i-1,j);
			it[rightUp]		= IX(i-1,j+1);
			it[right]		= IX(i,j+1);
			it[down]		= IX(i+1,j);
			it[leftDown]	= IX(i+1,j-1);
			it[left]		= IX(i,j-1);

            // Apply Decay
			m_decay += m_dt;
			if(m_decay > DECAY_TIME)
			{
				m_decay = 0.0f;

				if(m_dens[it[0]] > 0.01f)
					m_dens[it[0]] -= m_decayRate;		
			}

			// Apply Physics
			if(m_ship.applyPhysics(m_dens[it[0]], m_u[it[0]], m_v[it[0]], i, j))
			{
				float trail = 0.1f;
				//if(rand()%2==0)
				//	trail *= -1;
				//m_u[it[0]] += trail;
				//m_v[it[0]] += trail;
			}
			//m_teaPot.applyPhysics(m_dens[it[0]], m_u[it[0]], m_v[it[0]], i, j);
				
			m_rainTimer += m_dt;
			if(m_rainTimer > m_rainTimerSpacing)
			{
				m_rainTimer = 0.0f;

				if(m_bDrawRain)
					m_weather.applyRain(m_dens, m_u, m_v);
			}

			m_windTimer += m_dt;
			if(m_windTimer > m_windTimerSpacing)
			{
				m_windTimer = 0.0f;

				if(m_bDrawWind)
					m_weather.applyWind(m_u, m_v);
			}

			m_wavesTimer += m_dt;
			if(m_wavesTimer > m_wavesTimerSpacing)
			{
				m_wavesTimer = 0.0f;

				if(m_bDrawWaves)
					m_weather.applyWaves(m_dens, m_u, m_v);
			}

			// Calculating the awesome color for each vertex
			tColor color;
			if(0.0f < m_dens[it[0]])
			{
				color = colorLerp(m_backgroundColor, m_colors[m_colorShceme].DensityLayers[0], m_dens[it[0]]);
				color = colorLerp(color,  m_colors[m_colorShceme].DensityLayers[1], m_dens[it[0]]);
				color = colorLerp(color,  m_colors[m_colorShceme].DensityLayers[2], m_dens[it[0]]);
				color = colorLerp(color,  m_colors[m_colorShceme].DensityLayers[3], m_dens[it[0]]);
				color = colorLerp(color,  m_colors[m_colorShceme].DensityLayers[4], m_dens[it[0]]);
				color = colorLerp(color,  m_colors[m_colorShceme].DensityLayers[5], m_dens[it[0]]);
					
				float Uf = abs(m_u[it[0]]);
				float Vf = abs(m_v[it[0]]);		
				color = colorLerp( color,  m_colors[m_colorShceme].VelocityLayer, Uf / 10);		
				color = colorLerp( color,  m_colors[m_colorShceme].VelocityLayer, Vf / 10);						
			}
			else
				color = m_backgroundColor;
			
			// Setting the color
			cData[it[0]][0] = color.red;
			cData[it[0]][1] = color.green;
			cData[it[0]][2] = color.blue;

			// Calculating the height
			float height;
			if(!m_bDraw3d)
				height = 0.0f;
			else
			{
				height = m_dens[it[0]] - sqrt(m_u[it[0]]*m_u[it[0]]+m_v[it[0]]*m_v[it[0]]);
				if(height > 10.0f) // LIMIT_CUT
					height = 10.0f + height/20.0f;
				if(height < -10.0f)
					height = -10.0f + height/20.0f;

				height *= -1;
			}
		
			// Setting the vertices
			vData[it[0]][0] = x;
			vData[it[0]][1] = height;
			vData[it[0]][2] = y;

			// Setting the normals
			// -------------------
			float normal[3];
			float normalSum[3];
			normalSum[0] = 0.0f;
			normalSum[1] = 0.0f;
			normalSum[2] = 0.0f;
			// Triangle 1
			m3dFindNormalf(normal, vData[it[center]], vData[it[rightUp]], vData[it[right]]);
			normalSum[0] += normal[0];
			normalSum[1] += normal[1];
			normalSum[2] += normal[2];
			// Triangle 2
			m3dFindNormalf(normal, vData[it[center]], vData[it[right]], vData[it[down]]);
			normalSum[0] += normal[0];
			normalSum[1] += normal[1];
			normalSum[2] += normal[2];
			// Triangle 3
			m3dFindNormalf(normal, vData[it[center]], vData[it[down]], vData[it[leftDown]]);
			normalSum[0] += normal[0];
			normalSum[1] += normal[1];
			normalSum[2] += normal[2];
			// Triangle 4
			m3dFindNormalf(normal, vData[it[center]], vData[it[leftDown]], vData[it[left]]);
			normalSum[0] += normal[0];
			normalSum[1] += normal[1];
			normalSum[2] += normal[2];
			// Triangle 5
			m3dFindNormalf(normal, vData[it[center]], vData[it[left]], vData[it[up]]);
			normalSum[0] += normal[0];
			normalSum[1] += normal[1];
			normalSum[2] += normal[2];
			// Triangle 6
			m3dFindNormalf(normal, vData[it[center]], vData[it[up]], vData[it[rightUp]]);
			normalSum[0] += normal[0];
			normalSum[1] += normal[1];
			normalSum[2] += normal[2];

			normalSum[0] /= 6.0f;
			normalSum[1] /= 6.0f;
			normalSum[2] /= 6.0f;

			m3dNormalizeVectorf(normalSum);
			nData[it[0]][0] = normalSum[0];
			nData[it[0]][1] = normalSum[1];
			nData[it[0]][2] = normalSum[2];
		}
	}
	
	m_ship.update(m_dt);
}

void CDemo::setIndices(void)
{
	int i, j;
	for (i = 0; i < N; i++) 
	{
		for (j = 0; j < N; j++) 
		{
			// Triangle One
			// ------------
			// Left Up
			iData[IX(i,j)][0] = IX(i,j);
			// Right up
			iData[IX(i,j)][1] = IX(i,j+1);
			// Left down
			iData[IX(i,j)][2] = IX(i+1,j);

			// Triangle Two
			// ------------
			// Right up
			iData[IX(i,j)][3] = IX(i,j+1);
			// Right down
			iData[IX(i,j)][4] = IX(i+1,j+1);
			// Left down
			iData[IX(i,j)][5] = IX(i+1,j);
		}
	}
}

tColor CDemo::colorLerp(tColor start, tColor end, float range)
{
	//	C1 + s * (C2 - C1)
	tColor result;
	result.red   = start.red   + range * (end.red   - start.red);
	result.green = start.green + range * (end.green - start.green);
	result.blue  = start.blue  + range * (end.blue  - start.blue);
	return result;
}

void CDemo::drawSphere(float scale)
{
	GLSphere sphere(scale, 13, 26);
	sphere.Render();
}

void CDemo::toggleWireFrame(void)
{
	m_bWireFrame = !m_bWireFrame;
}

void CDemo::rainIntensityIncreace(bool increace)
{
		m_weather.intensityIncreace(increace);
}

void CDemo::rainSpreadIncreace(bool increace)
{
	if(increace)
		m_rainTimerSpacing += 1.0f;
	else if(m_rainTimerSpacing - 1 > 0)
	{
		m_rainTimerSpacing -= 1.0f;
	}
}

////////////////////////////////////////////////////////////////
// Solver Functions

void CDemo::add_source ( int N, float * x, float * s, float dt )
{
	int i, size=(N+2)*(N+2);
	for ( i=0 ; i<size ; i++ ) x[i] += dt*s[i];
}

void CDemo::set_bnd ( int N, int b, float * x )
{
	int i;

	for ( i=1 ; i<=N ; i++ ) {
		x[IX(0  ,i)] = b==1 ? -x[IX(1,i)] : x[IX(1,i)];
		x[IX(N+1,i)] = b==1 ? -x[IX(N,i)] : x[IX(N,i)];
		x[IX(i,0  )] = b==2 ? -x[IX(i,1)] : x[IX(i,1)];
		x[IX(i,N+1)] = b==2 ? -x[IX(i,N)] : x[IX(i,N)];
	}
	x[IX(0  ,0  )] = 0.5f*(x[IX(1,0  )]+x[IX(0  ,1)]);
	x[IX(0  ,N+1)] = 0.5f*(x[IX(1,N+1)]+x[IX(0  ,N)]);
	x[IX(N+1,0  )] = 0.5f*(x[IX(N,0  )]+x[IX(N+1,1)]);
	x[IX(N+1,N+1)] = 0.5f*(x[IX(N,N+1)]+x[IX(N+1,N)]);
}

void CDemo::lin_solve ( int N, int b, float * x, float * x0, float a, float c )
{
	int i, j, k;

	for ( k=0 ; k<20 ; k++ ) {
		FOR_EACH_CELL
			x[IX(i,j)] = (x0[IX(i,j)] + a*(x[IX(i-1,j)]+x[IX(i+1,j)]+x[IX(i,j-1)]+x[IX(i,j+1)]))/c;
		END_FOR
		set_bnd ( N, b, x );
	}
}

void CDemo::diffuse ( int N, int b, float * x, float * x0, float diff, float dt )
{
	float a=dt*diff*N*N;
	lin_solve ( N, b, x, x0, a, 1+4*a );
}

void CDemo::advect ( int N, int b, float * d, float * d0, float * u, float * v, float dt )
{
	int i, j, i0, j0, i1, j1;
	float x, y, s0, t0, s1, t1, dt0;

	dt0 = dt*N;
	FOR_EACH_CELL
		x = i-dt0*u[IX(i,j)]; y = j-dt0*v[IX(i,j)];
		if (x<0.5f) x=0.5f; if (x>N+0.5f) x=N+0.5f; i0=(int)x; i1=i0+1;
		if (y<0.5f) y=0.5f; if (y>N+0.5f) y=N+0.5f; j0=(int)y; j1=j0+1;
		s1 = x-i0; s0 = 1-s1; t1 = y-j0; t0 = 1-t1;
		d[IX(i,j)] = s0*(t0*d0[IX(i0,j0)]+t1*d0[IX(i0,j1)])+
					 s1*(t0*d0[IX(i1,j0)]+t1*d0[IX(i1,j1)]);
	END_FOR
	set_bnd ( N, b, d );
}

void CDemo::project ( int N, float * u, float * v, float * p, float * div )
{
	int i, j;

	FOR_EACH_CELL
		div[IX(i,j)] = -0.5f*(u[IX(i+1,j)]-u[IX(i-1,j)]+v[IX(i,j+1)]-v[IX(i,j-1)])/N;
		p[IX(i,j)] = 0;
	END_FOR	
	set_bnd ( N, 0, div ); set_bnd ( N, 0, p );

	lin_solve ( N, 0, p, div, 1, 4 );

	FOR_EACH_CELL
		u[IX(i,j)] -= 0.5f*N*(p[IX(i+1,j)]-p[IX(i-1,j)]);
		v[IX(i,j)] -= 0.5f*N*(p[IX(i,j+1)]-p[IX(i,j-1)]);
	END_FOR
	set_bnd ( N, 1, u ); set_bnd ( N, 2, v );
}

void CDemo::dens_step ( int N, float * x, float * x0, float * u, float * v, float diff, float dt )
{
	add_source ( N, x, x0, dt );
	SWAP ( x0, x ); diffuse ( N, 0, x, x0, diff, dt );
	SWAP ( x0, x ); advect ( N, 0, x, x0, u, v, dt );
}

void CDemo::vel_step ( int N, float * u, float * v, float * u0, float * v0, float visc, float dt )
{
	add_source ( N, u, u0, dt ); add_source ( N, v, v0, dt );
	SWAP ( u0, u ); diffuse ( N, 1, u, u0, visc, dt );
	SWAP ( v0, v ); diffuse ( N, 2, v, v0, visc, dt );
	project ( N, u, v, u0, v0 );
	SWAP ( u0, u ); SWAP ( v0, v );
	advect ( N, 1, u, u0, u0, v0, dt ); advect ( N, 2, v, v0, u0, v0, dt );
	project ( N, u, v, u0, v0 );
}