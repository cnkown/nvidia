################################################################################
# Automatically-generated file. Do not edit!
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
CU_SRCS += \
../ParticleSystem_cuda.cu 

CPP_SRCS += \
../GLSLProgram.cpp \
../ParticleSystem.cpp \
../SmokeRenderer.cpp \
../SmokeShaders.cpp \
../framebufferObject.cpp \
../particleDemo.cpp \
../renderbuffer.cpp 

O_SRCS += \
../GLSLProgram.o \
../ParticleSystem.o \
../ParticleSystem_cuda.o \
../SmokeRenderer.o \
../SmokeShaders.o \
../framebufferObject.o \
../particleDemo.o \
../renderbuffer.o 

OBJS += \
./GLSLProgram.o \
./ParticleSystem.o \
./ParticleSystem_cuda.o \
./SmokeRenderer.o \
./SmokeShaders.o \
./framebufferObject.o \
./particleDemo.o \
./renderbuffer.o 


# Each subdirectory must supply rules for building sources it contributes
%.o: ../%.cpp subdir.mk
	@echo 'Building file: $<'
	@echo 'Invoking: NVCC Compiler'
	/usr/local/cuda-11.3/bin/nvcc -gencode arch=compute_52,code=sm_52 -gencode arch=compute_52,code=compute_52 -ccbin g++ -c -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '

%.o: ../%.cu subdir.mk
	@echo 'Building file: $<'
	@echo 'Invoking: NVCC Compiler'
	/usr/local/cuda-11.3/bin/nvcc -gencode arch=compute_52,code=sm_52 -gencode arch=compute_52,code=compute_52 -ccbin g++ -c -o "$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '

SmokeShaders.o: /usr/include/stdc-predef.h


