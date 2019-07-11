import {NgModule} from "@angular/core";

import {AngularMaterialModule} from '../../modules/angular-material.module'
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ServicesModule} from "../services/services.module";

import {AgGridModule} from "ag-grid-angular";

import {ConfigureAnnotationsComponent} from "./configure-annotations.component";
import {UtilModule} from "./util.module";



@NgModule({
    imports: [
        AngularMaterialModule,
        CommonModule,
        FormsModule,
        ServicesModule,
        UtilModule,
        AgGridModule.withComponents([]),
        ReactiveFormsModule

    ],
    declarations: [
        ConfigureAnnotationsComponent,
    ],
    exports: [
        ConfigureAnnotationsComponent,
    ]

})

export class ConfigureAnnotationsModule {
}
