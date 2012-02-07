// GLSphere.h
// Implementation of the GLSphere class
// Richard S. Wright Jr.
// Yet another sphere class

#ifndef __GL_SPHERE__
#define __GL_SPHERE__

#include <math.h>
#include <math3d.h>

// Sphere has +Z pointing out of north pole.
class GLSphere
{
	public:
		// Constructors, no special destructors needed
		inline GLSphere(void) { sphereRadius = 1.0f; sphereStacks = 13; sphereSlices = 26; }
		
		inline GLSphere(float radius, int stacks, int slices) {
			sphereRadius = radius; sphereStacks = stacks; sphereSlices = slices; }
		
		inline void SetSize(float radius, int stacks, int slices)
			{	sphereRadius = radius; sphereStacks = stacks; sphereSlices = slices; }

		inline void SetRadius(float radius) { sphereRadius = radius; }

		////////////////////////////
		// Publicly accessable conversions
		// Converts spherical coordinates to cartesian coordiantes (uses Radians).
		// zAngle is the rotation around the Z axis (assumed pointing out of top of
		// sphere), and xyAngle is the angle up the sphere from the xy plane.
		// All "stuff" is as floats as this is intended to be used for graphics.
		// For double precision see the Math3D library.
		inline void SphereToPoint(const float zAngle, const float xyAngle, float cart[3])
			{
			float cosxy = (float)cos(xyAngle);

			// X
			cart[0] = cosxy * (float)cos(zAngle) * sphereRadius;

			// Y
			cart[1] = cosxy * (float)sin(zAngle) * sphereRadius;

			// Z
			cart[2] = (float)sin(xyAngle) * sphereRadius;
			}


		// Geographic location to cartesian coordiantes (uses degrees)
		// Latitude and longitude values are degrees.(e.g. 180.5)
		// Negative latitude is south of the equator, and negative longitude is west
		// of Greenwich England.
		inline float LongitudeTozAngle(const float longitude)
			{ return -(float)m3dDegToRad(longitude-180.0); }
		inline float LatitudeToxyAngle(const float latitude)
			{ return (float)m3dDegToRad(latitude-90.0); }


		////////////////////////////
		// Renders the whole globe
		void Render(void) const
			{
			float drho = float(3.141592653589) / (float) sphereStacks;
			float dtheta = 2.0f * float(3.141592653589) / (float) sphereSlices;
			float ds = 1.0f / sphereSlices;
			float dt = 1.0f / sphereStacks;
			float t = 1.0f;	


			for (int i = 0; i < sphereStacks; i++) 
				{
				float rho = i * drho;
				float srho = float(sin(rho));
				float crho = float(cos(rho));
				float srhodrho = float(sin(rho + drho));
				float crhodrho = float(cos(rho + drho));

				glBegin(GL_TRIANGLE_STRIP);
				GLfloat s = 0.0f;
				for (GLint j = 0; j <= sphereSlices; j++) 
					{
					float theta = (j == sphereSlices) ? 0.0f : j * dtheta;
					float stheta = float(-sin(theta));
					float ctheta = float(cos(theta));

					float x = stheta * srho;
					float y = ctheta * srho;
					float z = crho;
					glTexCoord2f(s, t);
					// The normals of a sphere are equal to the verteces normaled
					glNormal3f(x, y, z);
					glVertex3f(x * sphereRadius, y * sphereRadius, z * sphereRadius);

					x = stheta * srhodrho;
					y = ctheta * srhodrho;
					z = crhodrho;
					glTexCoord2f(s, t - dt);
					s += ds;
					// Do not forget the second vertex
					glNormal3f(x, y, z);
					glVertex3f(x * sphereRadius, y * sphereRadius, z * sphereRadius);
					}
				glEnd();

				t -= dt;
				}
			}
		
	// Very little internal data
	//protected:
		float	sphereRadius;
		int		sphereStacks;
		int		sphereSlices;
};




#endif
