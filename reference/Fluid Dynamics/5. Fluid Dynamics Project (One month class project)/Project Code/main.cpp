#include <windows.h>  // windows crap
#include <gl/gl.h>    // openGL 1.1
#include <gl/glu.h>   // openGL utilities
#include <gl/glut.h>  // openGL toolkit for demos
#include "Def.h"	  // definitions
#include "Demo.h"	  // demo class

int N; // Made global to comply with original source code

//----------------------------------------------------------------------
// GLUT callback routines
//----------------------------------------------------------------------

static void mouse_func ( int button, int state, int x, int y )
{
	CDemo *pDemo = &(CDemo::get());
	
	pDemo->omx = pDemo->mx = x;
	pDemo->omx = pDemo->my = y;

	pDemo->mouse_down[button] = state == GLUT_DOWN;
}

static void motion_func ( int x, int y )
{
	CDemo *pDemo = &(CDemo::get());

	pDemo->mx = x;
	pDemo->my = y;
}

static void key_func ( unsigned char key, int x, int y )
{
	CDemo *pDemo = &(CDemo::get());
	pDemo->keyboardInput();
	float heading = 10.0f;
	float go	  = 1.0f;

	switch ( key )
	{
		case 'z':
		case 'Z':
			pDemo->changeHeading(heading);
			break;
		case 'x':
		case 'X':
			pDemo->changeHeading(-heading);
			break;
		case '/':
		case '?':
			pDemo->engage(go);
			break;
		case 'a':
		case 'A':
			pDemo->toTheSails();
			break;

		case 'c':
		case 'C':
			// Clear
			pDemo->clearFluid();
			break;

		case 't':
		case 'T':
			pDemo->thinOut();
			break;

		case 'd':
		case 'D':
			pDemo->injectDensity();
			break;

		case 'v':
		case 'V':
			pDemo->injectVelocity();
			break;

		case 's':
		case 'S':
			pDemo->changeColorScheme();
			break;

		case 'w':
		case 'W':
			pDemo->toggleWireFrame();
			break;
		// Rain toggle
		case 'r':
		case 'R':
			pDemo->rainToggle();
			break;
		// Rain intensity
		case '[':
		case '{':
			pDemo->rainIntensityIncreace(true);
			break;
		case '\'':
		case '\"':
			pDemo->rainIntensityIncreace(false);
			break;
		// Rain spread
		case 'p':
		case 'P':
			pDemo->rainSpreadIncreace(false);
			break;
		case ';':
		case ':':
			pDemo->rainSpreadIncreace(true);
			break;

		case 'q':
		case 'Q':
			// The data is being freed in the demo destructor
			// exit ( 0 ); // Started crashing after I added the weather class, just click the X
			break;
	}
}

static void reshape_func ( int width, int height )
{	
	if(0 == height)
		height = 1;

	glViewport(0, 0, width, height);

	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	gluPerspective(35.0f, float(width) / float(height), 1.0f, 500.0f);

	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();

	glutReshapeWindow ( width, height );
}

static void idle_func ( void )
{
	CDemo *pDemo = &(CDemo::get());
	pDemo->idle();

	glutPostRedisplay ();
}

static void display_func ( void )
{
	// I know that I am already in model view mode and in the identity matrix (because of the end of ChangeSize)
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

	// Render
	CDemo *pDemo = &(CDemo::get());
	pDemo->render();

	glutSwapBuffers ();
	glutPostRedisplay();
}

// One time setup
void SetupGL(void)
{
	glClearColor(0.3f, 0.3f, 0.3f, 0.0f);
	//glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
	glEnable(GL_DEPTH_TEST);

	///////
	glEnable(GL_LIGHTING);

	GLfloat noLight[4] = { 0.01f, 0.01f, 0.01f, 0.01f };
	glLightModelfv(GL_LIGHT_MODEL_AMBIENT, noLight);

	// Setup light 0
	glEnable(GL_LIGHT0);
	GLfloat someLight[4] = { 1.0f, 1.0f, 1.0f, 1.0f };
	glLightfv(GL_LIGHT0, GL_AMBIENT, noLight);
	glLightfv(GL_LIGHT0, GL_DIFFUSE, someLight);
	glLightfv(GL_LIGHT0, GL_SPECULAR, someLight);

	// Setup light 1
	glEnable(GL_LIGHT1);
	glLightfv(GL_LIGHT1, GL_AMBIENT, noLight);
	glLightfv(GL_LIGHT1, GL_DIFFUSE, someLight);
	glLightfv(GL_LIGHT1, GL_SPECULAR, someLight);

	glEnable(GL_COLOR_MATERIAL);
	glColorMaterial(GL_FRONT, GL_DIFFUSE);
	///////

	// Cursor
	glutSetCursor(GLUT_CURSOR_NONE);

	// Initializing simulation variables
	CDemo *pDemo = &(CDemo::get());
	pDemo->setIndices();
}

void ShutdownGL(void)
{

}

//----------------------------------------------------------------------
// GLUT main routines
//----------------------------------------------------------------------

int main(int argc, char *argv[])
{
	glutInit(&argc, argv);
	glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
	glutInitWindowSize(WINDOW_WIDTH, WINDOW_HEIGHT);
	glutCreateWindow("Lou Hayt's WaterCraft");
	glutReshapeFunc(reshape_func);
	glutDisplayFunc(display_func);
	glutIdleFunc(idle_func);
	glutKeyboardFunc(key_func);	
	glutMouseFunc(mouse_func);
	glutMotionFunc(motion_func);

	printf ( "\nHow to use this demo (make sure numlock is on):\n\n" );
	printf ( "This version is 128x128\n\n" );
	printf ( "\t Add densities with the right mouse button,\n\n");
	printf ( "\t press 'd' for small waves or '-' for big waves\n\n" );
	printf ( "\t Add velocities with the left mouse button and dragging the mouse\n\n" );
	printf ( "\t press 'v' to stir it up\n\n" );
	printf ( "\t Toggle 3D display with the '+' key\n\n" );
	printf ( "\t Toggle 3D light with the '.' key\n\n" );
	printf ( "\t Toggle color schemes with the 's' key\n\n" );
	printf ( "\t Clear the simulation by pressing the 'c' key\n\n" );
	printf ( "\t Decrease densities randomly by pressing the 't' key\n\n" );
	printf ( "\t Toggle wireframe mode with the 'w' key\n\n" );
	printf ( "\t Toggle rain with the 'r' key\n\n" );
	printf ( "\t Press 'p', ';', '[' and ''' to affect the rain\n\n" );
	printf ( "\t Press 'a' to lower the sails and stop the ship\n\n" );
	printf ( "\t Press backspace to turn on vector lines (visible on 2D mode)\n\n" );
	printf ( "\t Use '/'. '*' and 0987654321 on the numpad to move the camera\n\n" );

	SetupGL();
	glutMainLoop();
	ShutdownGL();

	return 0;
}