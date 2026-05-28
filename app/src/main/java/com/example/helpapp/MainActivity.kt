package com.example.helpapp

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class MainActivity : AppCompatActivity() {
    private lateinit var simSpinner: Spinner
    private lateinit var timeSpinner: Spinner
    private val simList = mutableListOf<SubscriptionInfo>()

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val readPhoneState = permissions[Manifest.permission.READ_PHONE_STATE] ?: false
        val readPhoneNumbers = permissions[Manifest.permission.READ_PHONE_NUMBERS] ?: true // true if not requested
        if (readPhoneState && readPhoneNumbers) {
            loadSimInfo()
        } else {
            Toast.makeText(this, "Permission denied – cannot read SIM information", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        simSpinner = findViewById(R.id.spinnerSimDevice)
        timeSpinner = findViewById(R.id.spinnerTimeRange)

        // Populate time range spinner
        val timeOptions = arrayOf("Last 24 Hours", "Last 7 Days", "Last 30 Days", "Custom")
        val spinnerAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, timeOptions)
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        timeSpinner.adapter = spinnerAdapter
        timeSpinner.setSelection(0)
        timeSpinner.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>, view: android.view.View?, position: Int, id: Long) {
                val selected = timeOptions[position]
                Toast.makeText(this@MainActivity, "Time range: $selected", Toast.LENGTH_SHORT).show()
            }
            override fun onNothingSelected(parent: android.widget.AdapterView<*>) {}
        })

        // Request permissions
        val permissionsToRequest = mutableListOf(Manifest.permission.READ_PHONE_STATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            permissionsToRequest.add(Manifest.permission.READ_PHONE_NUMBERS)
        }
        
        val missingPermissions = permissionsToRequest.filter {
            ActivityCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            requestPermissionLauncher.launch(missingPermissions.toTypedArray())
        } else {
            loadSimInfo()
        }
    }

    private fun loadSimInfo() {
        val subscriptionManager = getSystemService(SubscriptionManager::class.java)
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        val activeSubs = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            subscriptionManager.activeSubscriptionInfoList
        } else {
            @Suppress("DEPRECATION")
            subscriptionManager.activeSubscriptionInfoList
        }
        
        val simOptions = mutableListOf<String>()
        if (activeSubs != null && activeSubs.isNotEmpty()) {
            simList.clear()
            simList.addAll(activeSubs)
            for (sim in activeSubs) {
                val carrierName = sim.carrierName?.toString() ?: "Unknown Carrier"
                val slot = sim.simSlotIndex + 1
                simOptions.add("SIM $slot - $carrierName")
            }
        } else {
            simOptions.add("No SIM card found")
        }

        val simAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, simOptions)
        simAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        simSpinner.adapter = simAdapter
    }
}
