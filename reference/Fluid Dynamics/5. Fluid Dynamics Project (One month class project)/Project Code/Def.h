#pragma once

#define WINDOW_WIDTH	800
#define WINDOW_HEIGHT	600

// Solver Macros (Taken from original source code)
#define IX(i,j) ((i)+(N+2)*(j))
#define SWAP(x0,x) {float * tmp=x0;x0=x;x=tmp;}
#define FOR_EACH_CELL for ( i=1 ; i<=N ; i++ ) { for ( j=1 ; j<=N ; j++ ) {
#define END_FOR }}

// Color
struct tColor
{
	float red;
	float green;
	float blue;
};

// Color Scheme
struct tColorScheme
{
	tColor DensityLayers[6];
	tColor VelocityLayer;
};

#define DECAY_TIME 0.1f
#define NUM_COLOR_SCHEMES 2

#define A_SIZE 16900 //4356 // Array size: (N+2)*(N+2) ...error: expected constant expression crap
#define WATER_SCALE 20.0f

enum{center = 0, up, rightUp, right, down, leftDown, left, totalIndexCount};
enum{leftUp = totalIndexCount, rightDown, totalDirectionCount};

#define LIMIT_CUT 5.0f