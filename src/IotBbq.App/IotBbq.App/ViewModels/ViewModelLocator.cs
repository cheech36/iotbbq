﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommonServiceLocator;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Threading;
using IotBbq.App.Services;
using IotBbq.App.Services.Implementation;

namespace IotBbq.App.ViewModels
{
    /// <summary>
    /// This class contains static references to all the view models in the
    /// application and provides an entry point for the bindings.
    /// </summary>
    public class ViewModelLocator
    {
        /// <summary>
        /// Initializes a new instance of the ViewModelLocator class.
        /// </summary>
        public ViewModelLocator()
        {
            DispatcherHelper.Initialize();

            SimpleIoc.Default.Register<IThermometerService, DesignThermometerService>();
            SimpleIoc.Default.Register<IAlarmService, DesignAlarmService>();

            SimpleIoc.Default.Register<MainViewModel>();

            ServiceLocator.SetLocatorProvider(new ServiceLocatorProvider(() => SimpleIoc.Default));
        }

        public MainViewModel Main
        {
            get
            {
                return ServiceLocator.Current.GetInstance<MainViewModel>();
            }
        }
    }
}