<template>
    <div class="modalContainer">
        <div v-for="item in toastr.allToastrs.value" :key="item.id" :data-id="item.id" @click="close(item.id)">
            <div class="modal" v-html="item.message" :class="getStyle(item.type)">
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { getToastr } from "../implementation/ToastrContainer";

const toastr = getToastr();

function getStyle(type: string) {
    switch (type.toLowerCase()) {
        case "error":
            return "error";
        case "warning":
            return "warning";
        case "information":
            return "information";
        case "success":
            return "success";
    }
}

function close(id: string)
{
    toastr.close(id);
}
</script> 
 
<style lang="scss" scoped>
.modal {
    min-height: 44px;
    padding: 10px 20px 10px 20px;
    margin-top: 15px;
    border-radius: 5px;
    box-shadow: 1px 1px 3px 0px #cccccc;
    cursor: pointer;
}

.error {
    color: #a94442;
    background-color: #f2dede;
    border: 1px solid #ebccd1;
}

.warning {
    color: #8a6d3b;
    background-color: #fcf8e3;
    border: 1px solid #faebcc;
}

.success {
    color: #3c763d;
    background-color: #dff0d8;
    border: 1px solid #d6e9c6;
}

.information {
    color: #31708f;
    background-color: #d9edf7;
    border: 1px solid #bce8f1;
}

.modalContainer {
    width: 400px;
    z-index: 999;
    left: 50%;
    margin-left: -200px;
    position: absolute;
    top: 0px;
}
</style>