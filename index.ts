import * as managers				from "./lib/managers";
import * as partition				from "./lib/partition";
import * as pick					from "./lib/pick";

import {Camera}						from "@awayjs/display/lib/display/Camera";
import {DirectionalLight}						from "@awayjs/display/lib/display/DirectionalLight";
import {Sprite}						from "@awayjs/display/lib/display/Sprite";
import {Shape}						from "@awayjs/display/lib/display/Shape";
import {LineSegment}						from "@awayjs/display/lib/display/LineSegment";
import {TextField}						from "@awayjs/display/lib/display/TextField";
import {LightProbe}						from "@awayjs/display/lib/display/LightProbe";
import {PointLight}						from "@awayjs/display/lib/display/PointLight";
import {MovieClip}						from "@awayjs/display/lib/display/MovieClip";
import {Skybox}						from "@awayjs/display/lib/display/Skybox";
import {Billboard}					from "@awayjs/display/lib/display/Billboard";
import {LineSegment}					from "@awayjs/display/lib/display/LineSegment";

import {View}							from "./lib/View";

partition.PartitionBase.registerAbstraction(partition.CameraNode, Camera);
partition.PartitionBase.registerAbstraction(partition.DirectionalLightNode, DirectionalLight);
partition.PartitionBase.registerAbstraction(partition.EntityNode, Sprite);
partition.PartitionBase.registerAbstraction(partition.EntityNode, Shape);
partition.PartitionBase.registerAbstraction(partition.EntityNode, MovieClip);
partition.PartitionBase.registerAbstraction(partition.EntityNode, Billboard);
partition.PartitionBase.registerAbstraction(partition.EntityNode, LineSegment);
partition.PartitionBase.registerAbstraction(partition.EntityNode, TextField);
partition.PartitionBase.registerAbstraction(partition.LightProbeNode, LightProbe);
partition.PartitionBase.registerAbstraction(partition.PointLightNode, PointLight);
partition.PartitionBase.registerAbstraction(partition.SkyboxNode, Skybox);

export {
	managers,
	partition,
	pick,
	View
}